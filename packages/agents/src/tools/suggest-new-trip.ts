import { tool } from "@langchain/core/tools";
import { z } from "zod";

const schema = z.object({
  title: z
    .string()
    .nullable()
    .describe("Short trip title, or null if undecided"),
  destinationId: z
    .string()
    .nullable()
    .describe("Destination ID from search results, or null if undecided"),
  destinationName: z
    .string()
    .nullable()
    .describe("Destination name for display, or null if undecided"),
  startDate: z
    .string()
    .nullable()
    .describe("Start date YYYY-MM-DD, or null if undecided"),
  endDate: z
    .string()
    .nullable()
    .describe("End date YYYY-MM-DD, or null if undecided"),
});

/**
 * Presents a new trip draft card to the user.
 *
 * The frontend renders this as a visual card with a CTA to create the trip.
 * When all fields are null, the card shows a generic "Start a new trip" button.
 * Use only for a genuinely new trip, never for continuing or repurposing the
 * currently active trip.
 */
export const suggestNewTripTool = tool(
  async () => {
    return "Presented new trip suggestion to the user.";
  },
  {
    name: "suggest_new_trip",
    description:
      "Present a new trip draft card to the user. Use this ONLY for a genuinely new trip, and only when the conversation is about a past finished trip or a cancelled trip that can no longer be modified. NEVER use it for the currently active trip, for destination exploration during an active trip-planning conversation, or as a shortcut instead of updating the current trip. Pass any known context (destination, dates, title) or null for undecided fields. The card renders a visual widget with a button to create the trip. After calling this, respond conversationally - acknowledge what the user said, and let them know they can click the card to get started. Do not repeat the card's exact fields.",
    schema,
  },
);
