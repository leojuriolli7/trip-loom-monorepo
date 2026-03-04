import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
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

export const requestPaymentResumeSchema = z.object({
  status: z.enum(["paid", "cancelled"]),
});

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

    if (response.status === "paid") {
      return `Payment completed for ${input.summary}. The booking is now confirmed.`;
    }

    return `Payment was cancelled for ${input.summary}. The booking remains unpaid. Ask the user if they want to try again or cancel the booking.`;
  },
  {
    name: "request_payment",
    description:
      "Request payment from the user for a booking. Use this after the user confirms a booking to initiate the Stripe payment flow. The graph will pause until payment is completed or cancelled.",
    schema: requestPaymentInputSchema,
  },
);
