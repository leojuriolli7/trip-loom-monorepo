import { tool } from "@langchain/core/tools";
import { z } from "zod";

const schema = z.object({
  destinations: z
    .array(
      z.object({
        id: z.string().describe("The destination ID from the search results"),
        name: z.string().describe("Destination name"),
        country: z.string().describe("Country name"),
        description: z
          .string()
          .optional()
          .describe("A short appealing description"),
      }),
    )
    .min(1)
    .describe("The list of destinations to present to the user"),
});

/**
 * Records destination suggestions via the tool-call trace.
 * Call this after searching/recommending destinations so the frontend
 * can render the structured tool-call payload from persisted history.
 */
export const suggestDestinationsTool = tool(
  async (input) => {
    return `Presented ${input.destinations.length} destination(s) to the user for selection.`;
  },
  {
    name: "suggest_destinations",
    description:
      "Present destination options to the user as a visual selection widget. Use this after searching destinations to let the user pick one interactively.",
    schema,
  },
);
