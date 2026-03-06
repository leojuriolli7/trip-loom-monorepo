import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

const requestCancellationInputSchema = z.object({
  bookingType: z
    .enum(["flight", "hotel"])
    .describe("The type of booking to cancel"),
  bookingId: z.string().describe("The booking ID to cancel"),
  summary: z
    .string()
    .describe(
      "Human-readable summary of what will be cancelled (e.g. 'Cancel Hotel Moliere booking, Jun 20 - Jul 14')",
    ),
});

export type RequestCancellationInput = z.infer<
  typeof requestCancellationInputSchema
>;

export type RequestCancellationInterrupt = {
  type: "request-cancellation";
} & RequestCancellationInput;

const requestCancellationBookingSchema = z.object({
  bookingType: z.enum(["flight", "hotel"]),
  bookingId: z.string(),
});

export const requestCancellationResumeSchema = requestCancellationBookingSchema.extend({
  confirmed: z.boolean(),
});

export type RequestCancellationResume = z.infer<
  typeof requestCancellationResumeSchema
>;

export type RequestCancellationToolResult = {
  type: "request-cancellation-result";
  confirmed: boolean;
  bookingType: "flight" | "hotel";
  bookingId: string;
  resolvedAt: string;
};

/**
 * Asks the user to confirm a booking cancellation before proceeding.
 * Interrupts the graph with a typed payload and waits for user input.
 * Resumes with { confirmed: boolean, bookingType, bookingId } from the user.
 */
export const requestCancellationTool = tool(
  async (input) => {
    const event: RequestCancellationInterrupt = {
      type: "request-cancellation",
      bookingType: input.bookingType,
      bookingId: input.bookingId,
      summary: input.summary,
    };

    // Pause and wait for user response
    const response = requestCancellationResumeSchema.parse(interrupt(event));
    const resolvedAt = new Date().toISOString();

    if (response.confirmed) {
      const result: RequestCancellationToolResult = {
        type: "request-cancellation-result",
        confirmed: true,
        bookingType: response.bookingType,
        bookingId: response.bookingId,
        resolvedAt,
      };

      return `${JSON.stringify(result)}\n\nUser confirmed cancellation. Delegate to the appropriate specialist to execute cancel_${input.bookingType}_booking with bookingId ${input.bookingId}.`;
    }

    const result: RequestCancellationToolResult = {
      type: "request-cancellation-result",
      confirmed: false,
      bookingType: response.bookingType,
      bookingId: response.bookingId,
      resolvedAt,
    };

    return `${JSON.stringify(result)}\n\nUser declined cancellation. Do NOT proceed. Acknowledge and ask what the user wants instead.`;
  },
  {
    name: "request_cancellation",
    description:
      "Ask the user to confirm a booking cancellation before proceeding. Use this before cancelling any flight or hotel booking. The graph will pause until the user responds.",
    schema: requestCancellationInputSchema,
  },
);
