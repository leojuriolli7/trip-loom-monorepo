import { z } from "zod";
import { paymentStatusEnum } from "../db/schema";

export const paymentStatusValues = paymentStatusEnum.enumValues;

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
