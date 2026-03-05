import { tool } from "@langchain/core/tools";
import { z } from "zod";

const schema = z.object({
  tripId: z.string().describe("The trip ID this itinerary belongs to"),
  days: z
    .array(
      z.object({
        dayNumber: z.number().describe("Day number (1-based)"),
        date: z.string().optional().describe("Date for this day (YYYY-MM-DD)"),
        activities: z
          .array(
            z.object({
              name: z.string().describe("Activity name"),
              description: z
                .string()
                .optional()
                .describe("Brief description of the activity"),
              startTime: z
                .string()
                .optional()
                .describe("Start time (HH:MM)"),
              endTime: z.string().optional().describe("End time (HH:MM)"),
              location: z.string().optional().describe("Activity location"),
            }),
          )
          .describe("Activities planned for this day"),
      }),
    )
    .min(1)
    .describe("The day-by-day itinerary"),
});

/**
 * Records a proposed itinerary via the tool-call trace.
 * Call this before saving so the frontend can render the
 * structured tool-call payload from persisted history.
 */
export const suggestItineraryTool = tool(
  async (input) => {
    const totalActivities = input.days.reduce(
      (sum, day) => sum + day.activities.length,
      0,
    );
    return `Presented a ${input.days.length}-day itinerary with ${totalActivities} activities to the user for review.`;
  },
  {
    name: "suggest_itinerary",
    description:
      "Present a proposed itinerary to the user as a visual day-by-day plan. Use this before saving to let the user review and approve the plan. After calling this tool, do not repeat the full plan and do not ask follow-up questions; hand off to the supervisor for user questioning.",
    schema,
  },
);
