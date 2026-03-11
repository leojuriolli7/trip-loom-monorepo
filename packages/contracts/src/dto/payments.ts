import { z } from "zod";
import { paymentStatusValues } from "../enums";

export const paymentBookingTypeValues = ["flight", "hotel"] as const;
export const paymentBookingTypeSchema = z.enum(paymentBookingTypeValues);

export type PaymentBookingType = z.infer<typeof paymentBookingTypeSchema>;

export const paymentSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  stripePaymentIntentId: z.string(),
  stripeCustomerId: z.string().nullable(),
  amountInCents: z.number().int().min(0),
  currency: z.string(),
  status: z.enum(paymentStatusValues),
  description: z.string().nullable(),
  refundedAmountInCents: z.number().int().min(0),
  metadata: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PaymentDTO = z.infer<typeof paymentSchema>;

export const paymentSessionSchema = z.object({
  id: z.string(),
  amountInCents: z.number().int().min(0),
  currency: z.string(),
  status: z.enum(paymentStatusValues),
  clientSecret: z.string().nullable(),
  checkoutUrl: z.string().url().nullable(),
});

export type PaymentSessionDTO = z.infer<typeof paymentSessionSchema>;

export const createPaymentSessionInputSchema = z.object({
  tripId: z.string().min(1),
  currency: z.string().trim().length(3).default("usd"),
  description: z.string().trim().min(1).max(500).optional(),
  bookingType: paymentBookingTypeSchema,
  bookingId: z.string().min(1),
});

export type CreatePaymentSessionInput = z.infer<
  typeof createPaymentSessionInputSchema
>;

export const requestCancellationToolResultSchema = z.object({
  type: z.literal("request-cancellation-result"),
  confirmed: z.boolean(),
  bookingType: paymentBookingTypeSchema,
  bookingId: z.string().min(1),
  resolvedAt: z.iso.datetime(),
});

export type RequestCancellationToolResult = z.infer<
  typeof requestCancellationToolResultSchema
>;

export const refundPaymentInputSchema = z.object({
  amountInCents: z.number().int().positive().optional(),
  reason: z.string().trim().min(1).max(120).optional(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentInputSchema>;

export const stripeWebhookResponseSchema = z.object({
  received: z.literal(true),
});
