import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  flightBooking,
  hotelBooking,
  payment,
  stripeWebhookEvent,
  trip,
} from "../db/schema";
import type {
  PaymentDTO,
  PaymentBookingType,
  PaymentSessionDTO,
  RefundPaymentInput,
} from "@trip-loom/contracts/dto/payments";
import {
  BadRequestError,
  BookingNotPayableError,
  ConflictError,
  NotFoundError,
  PaymentProcessingError,
} from "../errors";
import { generateId } from "../lib/nanoid";
import { paymentProvider } from "../lib/payments/provider";
import { paymentSelectFields } from "../mappers/payments";

type PaymentStatus = (typeof payment.$inferSelect)["status"];
type BookingType = PaymentBookingType;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type BookingReference = {
  tripId: string;
  bookingType: BookingType;
  bookingId: string;
};

type ResolvedBooking = {
  id: string;
  tripId: string;
  amountInCents: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentId: string | null;
};

type StoredPayment = Pick<
  typeof payment.$inferSelect,
  | "id"
  | "tripId"
  | "stripePaymentIntentId"
  | "stripeCustomerId"
  | "amountInCents"
  | "currency"
  | "status"
  | "description"
  | "refundedAmountInCents"
  | "metadata"
  | "createdAt"
  | "updatedAt"
>;

const mapPaymentToDTO = (row: typeof payment.$inferSelect): PaymentDTO => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
]);

const COMPLETED_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "succeeded",
  "partially_refunded",
  "refunded",
]);

const CREATE_INTENT_PENDING_STATUSES = new Set<ResolvedBooking["status"]>([
  "pending",
]);

const REUSABLE_PROVIDER_PAYMENT_INTENT_STATUSES = new Set([
  "requires_payment_method",
  "requires_action",
  "requires_confirmation",
]);

const isBookingType = (value: string): value is BookingType =>
  value === "flight" || value === "hotel";

const isTerminalPaymentStatus = (status: PaymentStatus): boolean =>
  TERMINAL_PAYMENT_STATUSES.has(status);

const isCompletedPaymentStatus = (status: PaymentStatus): boolean =>
  COMPLETED_PAYMENT_STATUSES.has(status);

const normalizeCurrency = (value: string): string => value.toLowerCase();

const buildPaymentCheckoutUrl = (input: {
  paymentId: string;
}): string => {
  return new URL(`/payments/${input.paymentId}`, process.env.FRONTEND_BASE_URL).toString();
};

// Stripe idempotency should be stable within one booking attempt, but not across
// every future retry forever. Attempt number prevents old terminal intents from
// being resurrected after a failed or already-completed checkout.
const buildPaymentIntentIdempotencyKey = (
  input: {
    tripId: string;
    bookingType: BookingType;
    bookingId: string;
    amountInCents: number;
    currency: string;
    attemptNumber: number;
  },
): string =>
  [
    "payment_intent",
    input.tripId,
    input.bookingType,
    input.bookingId,
    String(input.amountInCents),
    normalizeCurrency(input.currency),
    String(input.attemptNumber),
  ].join(":");

const buildRefundIdempotencyKey = (
  paymentId: string,
  amountInCents: number,
  alreadyRefundedInCents: number,
): string =>
  [
    "payment_refund",
    paymentId,
    String(alreadyRefundedInCents),
    String(amountInCents),
  ].join(":");

const serializeBookingReference = (value: BookingReference): string =>
  JSON.stringify(value);

const parseBookingReference = (
  metadata: string | null,
): BookingReference | null => {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadata) as Partial<BookingReference>;
    if (
      typeof parsed.tripId === "string" &&
      typeof parsed.bookingId === "string" &&
      typeof parsed.bookingType === "string" &&
      isBookingType(parsed.bookingType)
    ) {
      return {
        tripId: parsed.tripId,
        bookingType: parsed.bookingType,
        bookingId: parsed.bookingId,
      };
    }
  } catch {
    return null;
  }

  return null;
};

const parseProviderBookingReference = (
  metadata: Record<string, string>,
): BookingReference | null => {
  const tripId = metadata.tripId;
  const bookingId = metadata.bookingId;
  const bookingType = metadata.bookingType;

  if (
    typeof tripId !== "string" ||
    typeof bookingId !== "string" ||
    typeof bookingType !== "string" ||
    !isBookingType(bookingType)
  ) {
    return null;
  }

  return {
    tripId,
    bookingType,
    bookingId,
  };
};

const getOwnedPayment = async (
  userId: string,
  paymentId: string,
): Promise<PaymentDTO | null> => {
  const rows = await db
    .select(paymentSelectFields)
    .from(payment)
    .innerJoin(trip, eq(payment.tripId, trip.id))
    .where(and(eq(payment.id, paymentId), eq(trip.userId, userId)))
    .limit(1);
  return rows[0] ? mapPaymentToDTO(rows[0]) : null;
};

const reconcilePaymentForRead = async (
  storedPayment: StoredPayment,
): Promise<void> => {
  if (isTerminalPaymentStatus(storedPayment.status)) {
    return;
  }

  const bookingReference = parseBookingReference(storedPayment.metadata);
  if (!bookingReference) {
    return;
  }

  try {
    await reconcileExistingPaymentAttempt({
      bookingReference,
      existingPayment: storedPayment,
    });
  } catch (error) {
    if (!(error instanceof PaymentProcessingError)) {
      throw error;
    }
  }
};

const getResolvedBooking = async (
  tripId: string,
  bookingType: BookingType,
  bookingId: string,
): Promise<ResolvedBooking | null> => {
  if (bookingType === "flight") {
    const rows = await db
      .select({
        id: flightBooking.id,
        tripId: flightBooking.tripId,
        amountInCents: flightBooking.priceInCents,
        status: flightBooking.status,
        paymentId: flightBooking.paymentId,
      })
      .from(flightBooking)
      .where(
        and(eq(flightBooking.tripId, tripId), eq(flightBooking.id, bookingId)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  const rows = await db
    .select({
      id: hotelBooking.id,
      tripId: hotelBooking.tripId,
      amountInCents: hotelBooking.totalPriceInCents,
      status: hotelBooking.status,
      paymentId: hotelBooking.paymentId,
    })
    .from(hotelBooking)
    .where(and(eq(hotelBooking.tripId, tripId), eq(hotelBooking.id, bookingId)))
    .limit(1);

  return rows[0] ?? null;
};

const getStoredPaymentById = async (
  paymentId: string,
): Promise<StoredPayment | null> => {
  const rows = await db
    .select(paymentSelectFields)
    .from(payment)
    .where(eq(payment.id, paymentId))
    .limit(1);

  return rows[0] ?? null;
};

const getLatestStoredPaymentForBooking = async (
  bookingReference: BookingReference,
): Promise<StoredPayment | null> => {
  const serialized = serializeBookingReference(bookingReference);
  const rows = await db
    .select(paymentSelectFields)
    .from(payment)
    .where(
      and(
        eq(payment.tripId, bookingReference.tripId),
        eq(payment.metadata, serialized),
      ),
    )
    .orderBy(desc(payment.createdAt), desc(payment.id))
    .limit(1);

  return rows[0] ?? null;
};

const countStoredPaymentsForBooking = async (
  bookingReference: BookingReference,
): Promise<number> => {
  const serialized = serializeBookingReference(bookingReference);
  const rows = await db
    .select({ id: payment.id })
    .from(payment)
    .where(
      and(
        eq(payment.tripId, bookingReference.tripId),
        eq(payment.metadata, serialized),
      ),
    );

  return rows.length;
};

const resolveStripeStatusForClientReconciliation = (
  providerStatus: string,
): PaymentStatus | null => {
  if (providerStatus === "processing") {
    return "processing";
  }

  if (
    providerStatus === "requires_payment_method" ||
    providerStatus === "requires_action" ||
    providerStatus === "requires_confirmation" ||
    providerStatus === "requires_capture"
  ) {
    return "pending";
  }

  return null;
};

const deriveSuccessfulPaymentStatus = (input: {
  amountInCents: number;
  refundedAmountInCents: number;
}): PaymentStatus =>
  input.refundedAmountInCents >= input.amountInCents
    ? "refunded"
    : input.refundedAmountInCents > 0
      ? "partially_refunded"
      : "succeeded";

const persistSuccessfulPayment = async (
  tx: DbTransaction,
  input: {
    localPayment: StoredPayment;
    providerCustomerId: string | null;
    bookingReference: BookingReference;
  },
): Promise<void> => {
  // Webhooks and client-triggered reconciliation should converge on the same
  // final local state, so the success transition is centralized here.
  const nextStatus = deriveSuccessfulPaymentStatus({
    amountInCents: input.localPayment.amountInCents,
    refundedAmountInCents: input.localPayment.refundedAmountInCents,
  });

  await tx
    .update(payment)
    .set({
      status: nextStatus,
      stripeCustomerId:
        input.providerCustomerId ?? input.localPayment.stripeCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(payment.id, input.localPayment.id));

  if (nextStatus !== "refunded") {
    await confirmLinkedBooking(
      tx,
      input.bookingReference,
      input.localPayment.id,
    );
  }
};

const reconcileExistingPaymentAttempt = async (input: {
  bookingReference: BookingReference;
  existingPayment: StoredPayment;
}): Promise<PaymentSessionDTO | null> => {
  // Before creating a new intent, inspect the latest known Stripe intent for
  // this booking. Open intents can be reused, terminal intents must be
  // reflected locally, and only then do we create a fresh attempt.
  const providerIntent = await paymentProvider.retrievePaymentIntent(
    input.existingPayment.stripePaymentIntentId,
  );

  if (providerIntent.status === "succeeded") {
    await db.transaction(async (tx) => {
      await persistSuccessfulPayment(tx, {
        localPayment: input.existingPayment,
        providerCustomerId: providerIntent.customerId,
        bookingReference: input.bookingReference,
      });
    });

    return {
      id: input.existingPayment.id,
      amountInCents: input.existingPayment.amountInCents,
      currency: input.existingPayment.currency,
      status: "succeeded",
      clientSecret: null,
      checkoutUrl: null,
    };
  }

  const nextStatus = resolveStripeStatusForClientReconciliation(
    providerIntent.status,
  );

  if (providerIntent.status === "processing") {
    await db
      .update(payment)
      .set({
        status: "processing",
        stripeCustomerId:
          providerIntent.customerId ?? input.existingPayment.stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, input.existingPayment.id));

    throw new PaymentProcessingError("Payment is still processing");
  }

  if (REUSABLE_PROVIDER_PAYMENT_INTENT_STATUSES.has(providerIntent.status)) {
    if (!providerIntent.clientSecret) {
      throw new BadRequestError(
        "Payment provider did not return a client secret for this intent",
      );
    }

    await db
      .update(payment)
      .set({
        status: nextStatus ?? "pending",
        stripeCustomerId:
          providerIntent.customerId ?? input.existingPayment.stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, input.existingPayment.id));

    return {
      id: input.existingPayment.id,
      amountInCents: input.existingPayment.amountInCents,
      currency: input.existingPayment.currency,
      status: nextStatus ?? "pending",
      clientSecret: providerIntent.clientSecret,
      checkoutUrl: buildPaymentCheckoutUrl({
        paymentId: input.existingPayment.id,
      }),
    };
  }

  if (providerIntent.status === "canceled") {
    await db
      .update(payment)
      .set({
        status: "failed",
        stripeCustomerId:
          providerIntent.customerId ?? input.existingPayment.stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, input.existingPayment.id));
  }

  return null;
};

const resolveBookingReferenceFromWebhook = (input: {
  providerMetadata: Record<string, string>;
  persistedMetadata: string | null;
}): BookingReference | null =>
  parseProviderBookingReference(input.providerMetadata) ??
  parseBookingReference(input.persistedMetadata);

const cancelLinkedBookings = async (
  tx: DbTransaction,
  paymentId: string,
): Promise<void> => {
  await Promise.all([
    tx
      .update(flightBooking)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(flightBooking.paymentId, paymentId)),
    tx
      .update(hotelBooking)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(hotelBooking.paymentId, paymentId)),
  ]);
};

const confirmLinkedBooking = async (
  tx: DbTransaction,
  bookingReference: BookingReference,
  paymentId: string,
): Promise<void> => {
  if (bookingReference.bookingType === "flight") {
    await tx
      .update(flightBooking)
      .set({
        paymentId,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(flightBooking.id, bookingReference.bookingId),
          eq(flightBooking.tripId, bookingReference.tripId),
        ),
      );
    return;
  }

  await tx
    .update(hotelBooking)
    .set({
      paymentId,
      status: "confirmed",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(hotelBooking.id, bookingReference.bookingId),
        eq(hotelBooking.tripId, bookingReference.tripId),
      ),
    );
};

export async function createPaymentSessionForBooking(
  input: {
    tripId: string;
    currency: string;
    description?: string;
    bookingType: BookingType;
    bookingId: string;
  },
): Promise<PaymentSessionDTO> {
  const booking = await getResolvedBooking(
    input.tripId,
    input.bookingType,
    input.bookingId,
  );

  if (!booking) {
    throw new BadRequestError("Booking not found for this trip");
  }

  const linkedPayment = booking.paymentId
    ? await getStoredPaymentById(booking.paymentId)
    : null;

  if (linkedPayment && isCompletedPaymentStatus(linkedPayment.status)) {
    return {
      id: linkedPayment.id,
      amountInCents: linkedPayment.amountInCents,
      currency: linkedPayment.currency,
      status: linkedPayment.status,
      clientSecret: null,
      checkoutUrl: null,
    };
  }

  if (linkedPayment?.status === "processing") {
    throw new PaymentProcessingError("Payment is still processing");
  }

  if (!CREATE_INTENT_PENDING_STATUSES.has(booking.status)) {
    throw new BookingNotPayableError(
      "Only pending bookings can start a payment intent",
    );
  }

  const currency = normalizeCurrency(input.currency);
  const bookingReference: BookingReference = {
    tripId: input.tripId,
    bookingType: input.bookingType,
    bookingId: input.bookingId,
  };

  const existingPayment =
    linkedPayment ?? (await getLatestStoredPaymentForBooking(bookingReference));

  if (existingPayment) {
    const reusablePayment = await reconcileExistingPaymentAttempt({
      bookingReference,
      existingPayment,
    });

    if (reusablePayment) {
      return reusablePayment;
    }
  }

  const attemptNumber =
    (await countStoredPaymentsForBooking(bookingReference)) + 1;

  // The booking row is the source of truth for charge amount. The client only
  // identifies which booking is being paid.
  const providerIntent = await paymentProvider.createPaymentIntent({
    amountInCents: booking.amountInCents,
    currency,
    description: input.description,
    metadata: bookingReference,
    idempotencyKey: buildPaymentIntentIdempotencyKey({
      tripId: input.tripId,
      bookingType: input.bookingType,
      bookingId: input.bookingId,
      amountInCents: booking.amountInCents,
      currency,
      attemptNumber,
    }),
  });

  if (!providerIntent.clientSecret) {
    throw new BadRequestError(
      "Payment provider did not return a client secret for this intent",
    );
  }

  const [saved] = await db
    .insert(payment)
    .values({
      id: generateId(),
      tripId: input.tripId,
      stripePaymentIntentId: providerIntent.id,
      stripeCustomerId: providerIntent.customerId,
      amountInCents: booking.amountInCents,
      currency,
      status: "pending",
      description: input.description ?? null,
      refundedAmountInCents: 0,
      metadata: serializeBookingReference(bookingReference),
    })
    .onConflictDoUpdate({
      target: payment.stripePaymentIntentId,
      set: {
        amountInCents: booking.amountInCents,
        currency,
        description: input.description ?? null,
        metadata: serializeBookingReference(bookingReference),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: payment.id,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
    });

  return {
    id: saved.id,
    amountInCents: saved.amountInCents,
    currency: saved.currency,
    status: "pending",
    clientSecret: providerIntent.clientSecret,
    checkoutUrl: buildPaymentCheckoutUrl({
      paymentId: saved.id,
    }),
  };
}

export async function getPayment(
  userId: string,
  paymentId: string,
): Promise<PaymentDTO | null> {
  const ownedPayment = await getOwnedPayment(userId, paymentId);
  if (!ownedPayment) {
    return null;
  }

  const storedPayment = await getStoredPaymentById(paymentId);
  if (!storedPayment) {
    return null;
  }

  await reconcilePaymentForRead(storedPayment);

  return getOwnedPayment(userId, paymentId);
}

export async function getHostedPaymentSession(
  paymentId: string,
): Promise<PaymentSessionDTO> {
  const storedPayment = await getStoredPaymentById(paymentId);

  if (!storedPayment) {
    throw new NotFoundError("Payment session not found");
  }

  if (isCompletedPaymentStatus(storedPayment.status)) {
    throw new ConflictError("This payment session has already been completed");
  }

  if (storedPayment.status === "processing") {
    throw new PaymentProcessingError("Payment is still processing");
  }

  const bookingReference = parseBookingReference(storedPayment.metadata);
  if (!bookingReference) {
    throw new ConflictError("Payment session is missing booking metadata");
  }

  const reconciledSession = await reconcileExistingPaymentAttempt({
    bookingReference,
    existingPayment: storedPayment,
  });

  if (!reconciledSession) {
    throw new ConflictError("This payment session is no longer available");
  }

  if (reconciledSession.status === "succeeded") {
    throw new ConflictError("This payment session has already been completed");
  }

  if (!reconciledSession.clientSecret) {
    throw new ConflictError("This payment session cannot be resumed");
  }

  return reconciledSession;
}

export async function refundPayment(
  userId: string,
  paymentId: string,
  input: RefundPaymentInput,
): Promise<PaymentDTO | null> {
  const ownedPayment = await getOwnedPayment(userId, paymentId);
  if (!ownedPayment) {
    return null;
  }

  if (
    ownedPayment.status !== "succeeded" &&
    ownedPayment.status !== "partially_refunded"
  ) {
    throw new BadRequestError(
      "Only succeeded or partially refunded payments can be refunded",
    );
  }

  const remainingInCents =
    ownedPayment.amountInCents - ownedPayment.refundedAmountInCents;

  if (remainingInCents <= 0) {
    throw new BadRequestError("Payment has no refundable amount left");
  }

  const refundAmountInCents = input.amountInCents ?? remainingInCents;

  if (refundAmountInCents <= 0 || refundAmountInCents > remainingInCents) {
    throw new BadRequestError(
      "amountInCents must be greater than zero and no more than remaining refundable amount",
    );
  }

  await paymentProvider.createRefund({
    paymentIntentId: ownedPayment.stripePaymentIntentId,
    amountInCents: refundAmountInCents,
    reason: input.reason,
    metadata: {
      paymentId: ownedPayment.id,
      tripId: ownedPayment.tripId,
    },
    idempotencyKey: buildRefundIdempotencyKey(
      ownedPayment.id,
      refundAmountInCents,
      ownedPayment.refundedAmountInCents,
    ),
  });

  const nextRefundedAmountInCents =
    ownedPayment.refundedAmountInCents + refundAmountInCents;
  const nextStatus: PaymentStatus =
    nextRefundedAmountInCents >= ownedPayment.amountInCents
      ? "refunded"
      : "partially_refunded";

  await db.transaction(async (tx) => {
    await tx
      .update(payment)
      .set({
        refundedAmountInCents: nextRefundedAmountInCents,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, ownedPayment.id));

    if (nextStatus === "refunded") {
      await cancelLinkedBookings(tx, ownedPayment.id);
    }
  });

  return getOwnedPayment(userId, ownedPayment.id);
}

export async function handleStripeWebhook(
  signature: string,
  payload: string,
): Promise<void> {
  const webhookEvent = await paymentProvider.constructWebhookEvent(
    signature,
    payload,
  );

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(stripeWebhookEvent)
      .values({
        id: webhookEvent.id,
        type: webhookEvent.type,
        payload: webhookEvent.payload,
      })
      .onConflictDoNothing()
      .returning({ id: stripeWebhookEvent.id });

    if (inserted.length === 0) {
      return;
    }

    switch (webhookEvent.kind) {
      case "payment_intent": {
        if (webhookEvent.type === "payment_intent.payment_failed") {
          const rows = await tx
            .select({
              id: payment.id,
              status: payment.status,
              stripeCustomerId: payment.stripeCustomerId,
            })
            .from(payment)
            .where(
              eq(payment.stripePaymentIntentId, webhookEvent.paymentIntent.id),
            )
            .limit(1);

          const localPayment = rows[0];
          if (!localPayment || isTerminalPaymentStatus(localPayment.status)) {
            return;
          }

          const reconciledStatus =
            resolveStripeStatusForClientReconciliation(
              webhookEvent.paymentIntent.status,
            ) ?? "failed";

          await tx
            .update(payment)
            .set({
              status: reconciledStatus,
              stripeCustomerId:
                webhookEvent.paymentIntent.customerId ??
                localPayment.stripeCustomerId,
              updatedAt: new Date(),
            })
            .where(eq(payment.id, localPayment.id));

          return;
        }

        const rows = await tx
          .select({
            id: payment.id,
            tripId: payment.tripId,
            amountInCents: payment.amountInCents,
            refundedAmountInCents: payment.refundedAmountInCents,
            stripeCustomerId: payment.stripeCustomerId,
            metadata: payment.metadata,
          })
          .from(payment)
          .where(
            eq(payment.stripePaymentIntentId, webhookEvent.paymentIntent.id),
          )
          .limit(1);

        const localPayment = rows[0];
        if (!localPayment) {
          return;
        }

        const nextStatus: PaymentStatus =
          localPayment.refundedAmountInCents >= localPayment.amountInCents
            ? "refunded"
            : localPayment.refundedAmountInCents > 0
              ? "partially_refunded"
              : "succeeded";

        await tx
          .update(payment)
          .set({
            status: nextStatus,
            stripeCustomerId:
              webhookEvent.paymentIntent.customerId ??
              localPayment.stripeCustomerId,
            updatedAt: new Date(),
          })
          .where(eq(payment.id, localPayment.id));

        const bookingReference = resolveBookingReferenceFromWebhook({
          providerMetadata: webhookEvent.paymentIntent.metadata,
          persistedMetadata: localPayment.metadata,
        });

        if (
          bookingReference &&
          bookingReference.tripId === localPayment.tripId &&
          nextStatus !== "refunded"
        ) {
          await confirmLinkedBooking(tx, bookingReference, localPayment.id);
        }

        return;
      }

      case "charge_refunded": {
        if (!webhookEvent.charge.paymentIntentId) {
          return;
        }

        const rows = await tx
          .select({
            id: payment.id,
            amountInCents: payment.amountInCents,
          })
          .from(payment)
          .where(
            eq(
              payment.stripePaymentIntentId,
              webhookEvent.charge.paymentIntentId,
            ),
          )
          .limit(1);

        const localPayment = rows[0];
        if (!localPayment) {
          return;
        }

        const refundedAmountInCents = Math.min(
          webhookEvent.charge.amountRefundedInCents,
          localPayment.amountInCents,
        );
        const nextStatus: PaymentStatus =
          refundedAmountInCents >= localPayment.amountInCents
            ? "refunded"
            : "partially_refunded";

        await tx
          .update(payment)
          .set({
            refundedAmountInCents,
            status: nextStatus,
            updatedAt: new Date(),
          })
          .where(eq(payment.id, localPayment.id));

        if (nextStatus === "refunded") {
          await cancelLinkedBookings(tx, localPayment.id);
        }

        return;
      }

      case "unhandled":
        return;
    }
  });
}
