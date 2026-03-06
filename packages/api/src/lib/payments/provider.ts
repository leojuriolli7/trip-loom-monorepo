import Stripe from "stripe";

export type ProviderPaymentIntent = {
  id: string;
  clientSecret: string | null;
  status: string;
  customerId: string | null;
  metadata: Record<string, string>;
};

export type ProviderRefund = {
  id: string;
  paymentIntentId: string | null;
  amountInCents: number;
};

export type ProviderPaymentIntentWebhookEvent = {
  kind: "payment_intent";
  id: string;
  type: "payment_intent.succeeded" | "payment_intent.payment_failed";
  payload: string;
  paymentIntent: ProviderPaymentIntent;
};

export type ProviderChargeRefundedWebhookEvent = {
  kind: "charge_refunded";
  id: string;
  type: "charge.refunded";
  payload: string;
  charge: {
    paymentIntentId: string | null;
    amountRefundedInCents: number;
  };
};

export type ProviderUnhandledWebhookEvent = {
  kind: "unhandled";
  id: string;
  type: string;
  payload: string;
};

export type ProviderWebhookEvent =
  | ProviderPaymentIntentWebhookEvent
  | ProviderChargeRefundedWebhookEvent
  | ProviderUnhandledWebhookEvent;

export type CreateProviderPaymentIntentInput = {
  amountInCents: number;
  currency: string;
  description?: string;
  metadata: Record<string, string>;
  customerId?: string | null;
  idempotencyKey: string;
};

export type CreateProviderRefundInput = {
  paymentIntentId: string;
  amountInCents: number;
  reason?: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
};

export interface PaymentProvider {
  createPaymentIntent(
    input: CreateProviderPaymentIntentInput,
  ): Promise<ProviderPaymentIntent>;
  retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<ProviderPaymentIntent>;
  createRefund(input: CreateProviderRefundInput): Promise<ProviderRefund>;
  constructWebhookEvent(
    signature: string,
    payload: string,
  ): Promise<ProviderWebhookEvent>;
}

const normalizeMetadata = (
  metadata: Record<string, string | null | undefined> | null | undefined,
): Record<string, string> => {
  if (!metadata) {
    return {};
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && value !== null) {
      normalized[key] = String(value);
    }
  }

  return normalized;
};

const getStripeClient = (): Stripe => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  return new Stripe(stripeSecretKey);
};

const getStripeWebhookSecret = (): string => {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }

  return stripeWebhookSecret;
};

const toProviderPaymentIntent = (
  paymentIntent: Stripe.PaymentIntent,
): ProviderPaymentIntent => {
  const customer =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status,
    customerId: customer ?? null,
    metadata: normalizeMetadata(paymentIntent.metadata),
  };
};

const normalizeRefundReason = (
  reason?: string,
): Stripe.RefundCreateParams.Reason | undefined => {
  if (!reason) {
    return undefined;
  }

  const normalized = reason.trim().toLowerCase();
  if (
    normalized === "duplicate" ||
    normalized === "fraudulent" ||
    normalized === "requested_by_customer"
  ) {
    return normalized;
  }

  return undefined;
};

export const paymentProvider: PaymentProvider = {
  async createPaymentIntent(input) {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: input.amountInCents,
        currency: input.currency,
        description: input.description,
        metadata: input.metadata,
        customer: input.customerId ?? undefined,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: input.idempotencyKey },
    );

    return toProviderPaymentIntent(paymentIntent);
  },

  async retrievePaymentIntent(paymentIntentId) {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return toProviderPaymentIntent(paymentIntent);
  },

  async createRefund(input) {
    const stripe = getStripeClient();
    const refund = await stripe.refunds.create(
      {
        payment_intent: input.paymentIntentId,
        amount: input.amountInCents,
        metadata: input.metadata,
        reason: normalizeRefundReason(input.reason),
      },
      { idempotencyKey: input.idempotencyKey },
    );

    const paymentIntentId =
      typeof refund.payment_intent === "string"
        ? refund.payment_intent
        : (refund.payment_intent?.id ?? null);

    return {
      id: refund.id,
      paymentIntentId,
      amountInCents: refund.amount,
    };
  },

  async constructWebhookEvent(signature, payload) {
    const stripe = getStripeClient();

    // Stripe with Bun requires using the async version.
    const event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      getStripeWebhookSecret(),
    );

    switch (event.type) {
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return {
          kind: "payment_intent",
          id: event.id,
          type: event.type,
          payload,
          paymentIntent: toProviderPaymentIntent(paymentIntent),
        };
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : (charge.payment_intent?.id ?? null);

        return {
          kind: "charge_refunded",
          id: event.id,
          type: event.type,
          payload,
          charge: {
            paymentIntentId,
            amountRefundedInCents: charge.amount_refunded,
          },
        };
      }
      default: {
        return {
          kind: "unhandled",
          id: event.id,
          type: event.type,
          payload,
        };
      }
    }
  },
};
