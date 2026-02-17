import { payment } from "../db/schema";

export const paymentSelectFields = {
  id: payment.id,
  tripId: payment.tripId,
  stripePaymentIntentId: payment.stripePaymentIntentId,
  stripeCustomerId: payment.stripeCustomerId,
  amountInCents: payment.amountInCents,
  currency: payment.currency,
  status: payment.status,
  description: payment.description,
  refundedAmountInCents: payment.refundedAmountInCents,
  metadata: payment.metadata,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
} as const;
