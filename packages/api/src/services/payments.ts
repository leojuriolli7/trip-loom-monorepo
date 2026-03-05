import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  flightBooking,
  hotelBooking,
  payment,
  stripeWebhookEvent,
  trip,
} from "../db/schema";
import type {
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
  PaymentDTO,
  PaymentIntentResponse,
  RefundPaymentInput,
} from "@trip-loom/contracts/dto/payments";
import { BadRequestError, ConflictError } from "../errors";
import { generateId } from "../lib/nanoid";
import { paymentProvider } from "../lib/payments/provider";
import { getOwnedTripMeta } from "../lib/trips/ownership";
import { paymentSelectFields } from "../mappers/payments";

type PaymentStatus = (typeof payment.$inferSelect)["status"];
type BookingType = CreatePaymentIntentInput["bookingType"];
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

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
]);

const CREATE_INTENT_PENDING_STATUSES = new Set<ResolvedBooking["status"]>([
  "pending",
]);

const isBookingType = (value: string): value is BookingType =>
  value === "flight" || value === "hotel";

const isTerminalPaymentStatus = (status: PaymentStatus): boolean =>
  TERMINAL_PAYMENT_STATUSES.has(status);

const normalizeCurrency = (value: string): string => value.toLowerCase();

const buildPaymentIntentIdempotencyKey = (
  input: CreatePaymentIntentInput,
): string =>
  [
    "payment_intent",
    input.tripId,
    input.bookingType,
    input.bookingId,
    String(input.amountInCents),
    normalizeCurrency(input.currency),
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

  return rows[0] ?? null;
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

export async function createPaymentIntent(
  userId: string,
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResponse | null> {
  const tripMeta = await getOwnedTripMeta(userId, input.tripId);
  if (!tripMeta) {
    return null;
  }

  const booking = await getResolvedBooking(
    input.tripId,
    input.bookingType,
    input.bookingId,
  );

  if (!booking) {
    throw new BadRequestError("Booking not found for this trip");
  }

  if (booking.paymentId) {
    throw new ConflictError("Booking already has an associated payment");
  }

  if (!CREATE_INTENT_PENDING_STATUSES.has(booking.status)) {
    throw new BadRequestError(
      "Only pending bookings can start a payment intent",
    );
  }

  if (booking.amountInCents !== input.amountInCents) {
    throw new BadRequestError(
      "amountInCents must exactly match the booking total",
    );
  }

  const currency = normalizeCurrency(input.currency);
  const bookingReference: BookingReference = {
    tripId: input.tripId,
    bookingType: input.bookingType,
    bookingId: input.bookingId,
  };

  const providerIntent = await paymentProvider.createPaymentIntent({
    amountInCents: input.amountInCents,
    currency,
    description: input.description,
    metadata: bookingReference,
    idempotencyKey: buildPaymentIntentIdempotencyKey({
      ...input,
      currency,
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
      amountInCents: input.amountInCents,
      currency,
      status: "pending",
      description: input.description ?? null,
      refundedAmountInCents: 0,
      metadata: serializeBookingReference(bookingReference),
    })
    .onConflictDoUpdate({
      target: payment.stripePaymentIntentId,
      set: {
        amountInCents: input.amountInCents,
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
    clientSecret: providerIntent.clientSecret,
    paymentId: saved.id,
    amountInCents: saved.amountInCents,
    currency: saved.currency,
  };
}

export async function confirmPayment(
  userId: string,
  input: ConfirmPaymentInput,
): Promise<PaymentDTO | null> {
  const ownedPayment = await getOwnedPayment(userId, input.paymentId);
  if (!ownedPayment) {
    return null;
  }

  if (ownedPayment.stripePaymentIntentId !== input.paymentIntentId) {
    throw new BadRequestError(
      "paymentIntentId does not match the requested payment",
    );
  }

  const providerIntent = await paymentProvider.retrievePaymentIntent(
    input.paymentIntentId,
  );

  const nextStatus = resolveStripeStatusForClientReconciliation(
    providerIntent.status,
  );

  if (
    nextStatus &&
    nextStatus !== ownedPayment.status &&
    !isTerminalPaymentStatus(ownedPayment.status)
  ) {
    await db
      .update(payment)
      .set({
        status: nextStatus,
        stripeCustomerId:
          providerIntent.customerId ?? ownedPayment.stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, ownedPayment.id));
  }

  return getOwnedPayment(userId, input.paymentId);
}

export async function getPayment(
  userId: string,
  paymentId: string,
): Promise<PaymentDTO | null> {
  return getOwnedPayment(userId, paymentId);
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
  const webhookEvent = paymentProvider.constructWebhookEvent(
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

          await tx
            .update(payment)
            .set({
              status: "failed",
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
