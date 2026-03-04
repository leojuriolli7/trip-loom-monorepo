import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

const requestConfirmationInputSchema = z.object({
  action: z
    .string()
    .describe(
      "Short action label (e.g. 'Book flight', 'Cancel hotel booking')",
    ),
  summary: z
    .string()
    .describe("Human-readable summary of what will happen if confirmed"),
  details: z
    .record(z.string(), z.unknown())
    .optional()
    .default({})
    .describe(
      "Structured details about the action (booking info, prices, etc.)",
    ),
});

export type RequestConfirmationInput = z.infer<
  typeof requestConfirmationInputSchema
>;

export type RequestConfirmationInterrupt = {
  type: "request-confirmation";
} & RequestConfirmationInput;

export const requestConfirmationResumeSchema = z.object({
  confirmed: z.boolean(),
});

export type RequestConfirmationResume = z.infer<
  typeof requestConfirmationResumeSchema
>;

/**
 * Asks the user to confirm an action before proceeding.
 * Interrupts the graph with a typed payload and waits for user input.
 * Resumes with { confirmed: boolean } from the user.
 */
export const requestConfirmationTool = tool(
  async (input) => {
    const event: RequestConfirmationInterrupt = {
      type: "request-confirmation",
      action: input.action,
      summary: input.summary,
      details: input.details,
    };

    // Pause and wait for user response
    const response = requestConfirmationResumeSchema.parse(interrupt(event));

    if (response.confirmed) {
      return `User confirmed: "${input.action}". Proceed with the action.`;
    }

    return `User declined: "${input.action}". Do NOT proceed. Ask the user what they'd like to do instead.`;
  },
  {
    name: "request_confirmation",
    description:
      "Ask the user to confirm an action before proceeding. Use this before any irreversible action like booking or cancellation. The graph will pause until the user responds.",
    schema: requestConfirmationInputSchema,
  },
);
