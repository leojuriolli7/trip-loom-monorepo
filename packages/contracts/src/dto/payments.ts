import { z } from "zod";
import { paymentStatusValues } from "../enums";

export const paymentBookingTypeValues = ["flight", "hotel"] as const;
export const paymentBookingTypeSchema = z.enum(paymentBookingTypeValues);

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
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentDTO = z.infer<typeof paymentSchema>;

export const createPaymentIntentInputSchema = z.object({
  tripId: z.string().min(1),
  currency: z.string().trim().length(3).default("usd"),
  description: z.string().trim().min(1).max(500).optional(),
  bookingType: paymentBookingTypeSchema,
  bookingId: z.string().min(1),
});

export type CreatePaymentIntentInput = z.infer<
  typeof createPaymentIntentInputSchema
>;

export const paymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  paymentId: z.string(),
  amountInCents: z.number().int().positive(),
  currency: z.string(),
});

export type PaymentIntentResponse = z.infer<typeof paymentIntentResponseSchema>;

export const confirmPaymentInputSchema = z.object({
  paymentId: z.string().min(1),
  paymentIntentId: z.string().min(1),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentInputSchema>;

const requestPaymentResultBookingSchema = z.object({
  bookingType: paymentBookingTypeSchema,
  bookingId: z.string().min(1),
});

export const requestPaymentToolResultSchema = z.discriminatedUnion("status", [
  requestPaymentResultBookingSchema.extend({
    type: z.literal("request-payment-result"),
    status: z.literal("paid"),
    paymentId: z.string().min(1),
    resolvedAt: z.string().datetime(),
  }),
  requestPaymentResultBookingSchema.extend({
    type: z.literal("request-payment-result"),
    status: z.literal("cancelled"),
    resolvedAt: z.string().datetime(),
  }),
]);

export type RequestPaymentToolResult = z.infer<
  typeof requestPaymentToolResultSchema
>;

export const refundPaymentInputSchema = z.object({
  amountInCents: z.number().int().positive().optional(),
  reason: z.string().trim().min(1).max(120).optional(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentInputSchema>;

export const stripeWebhookResponseSchema = z.object({
  received: z.literal(true),
});
