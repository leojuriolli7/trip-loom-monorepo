import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import {
  type RequestPaymentToolResult,
} from "@trip-loom/contracts/dto/payments";
import { z } from "zod";

const requestPaymentInputSchema = z.object({
  bookingType: z
    .enum(["flight", "hotel"])
    .describe("The type of booking being paid for"),
  bookingId: z.string().describe("The booking ID to pay for"),
  amount: z.number().describe("Payment amount"),
  currency: z.string().describe("Currency code (e.g. USD, EUR)"),
  summary: z
    .string()
    .describe("Human-readable summary of the payment (e.g. 'Flight to Tokyo - $450')"),
});

export type RequestPaymentInput = z.infer<typeof requestPaymentInputSchema>;

export type RequestPaymentInterrupt = {
  type: "request-payment";
} & RequestPaymentInput;

const requestPaymentBookingSchema = z.object({
  bookingType: z.enum(["flight", "hotel"]),
  bookingId: z.string(),
});

export const requestPaymentResumeSchema = z.discriminatedUnion("status", [
  requestPaymentBookingSchema.extend({
    status: z.literal("paid"),
    paymentId: z.string(),
  }),
  requestPaymentBookingSchema.extend({
    status: z.literal("cancelled"),
  }),
]);

export type RequestPaymentResume = z.infer<typeof requestPaymentResumeSchema>;

/**
 * Requests payment from the user for a booking.
 * Interrupts the graph with a typed payload and waits for user input.
 * Resumes with { status: "paid" | "cancelled" } from the user.
 */
export const requestPaymentTool = tool(
  async (input) => {
    const event: RequestPaymentInterrupt = {
      type: "request-payment",
      bookingType: input.bookingType,
      bookingId: input.bookingId,
      amount: input.amount,
      currency: input.currency,
      summary: input.summary,
    };

    // Pause and wait for payment result
    const response = requestPaymentResumeSchema.parse(interrupt(event));
    const resolvedAt = new Date().toISOString();

    if (response.status === "paid") {
      const result: RequestPaymentToolResult = {
        type: "request-payment-result",
        status: "paid",
        bookingType: response.bookingType,
        bookingId: response.bookingId,
        paymentId: response.paymentId,
        resolvedAt,
      };

      return `${JSON.stringify(result)}\n\nIMPORTANT: Payment complete. This booking flow is FINISHED. Do NOT delegate to any sub-agent for this booking. Acknowledge payment to the user and ask about next steps.`;
    }

    const result: RequestPaymentToolResult = {
      type: "request-payment-result",
      status: "cancelled",
      bookingType: response.bookingType,
      bookingId: response.bookingId,
      resolvedAt,
    };

    return `${JSON.stringify(result)}\n\nPayment cancelled. The booking remains pending but unpaid. Ask the user what they want to do. Do NOT re-delegate to create a new booking unless the user explicitly asks.`;
  },
  {
    name: "request_payment",
    description:
      "Request payment from the user for a booking. Use this after the user confirms a booking to initiate the Stripe payment flow. The graph will pause until payment is completed or cancelled.",
    schema: requestPaymentInputSchema,
  },
);
