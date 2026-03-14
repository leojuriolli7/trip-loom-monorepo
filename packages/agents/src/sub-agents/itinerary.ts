import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
import type { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  itineraryWithTripSchema,
  itineraryDaySchema,
  itineraryActivitySchema,
} from "@trip-loom/contracts/dto/itineraries";

/**
 * Lenient version of itineraryWithTripSchema that coerces dates from JSON strings.
 * The MCP resource returns serialized JSON where Date fields become strings.
 */
const itineraryResourceSchema = z.array(
  itineraryWithTripSchema.extend({
    createdAt: z.coerce.date(),
    days: z.array(
      itineraryDaySchema.extend({
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
        activities: z.array(
          itineraryActivitySchema.extend({
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
        ),
      }),
    ),
  }),
);

/**
 * Parses raw itineraries JSON from the MCP resource and formats as XML.
 * Returns null if parsing fails or no itineraries exist.
 */
function formatItinerariesResource(raw: string): string | null {
  try {
    const itineraries = itineraryResourceSchema.parse(JSON.parse(raw));

    if (itineraries.length === 0) return null;

    const lines: string[] = ["<past-itineraries>"];

    for (const it of itineraries) {
      lines.push("  <itinerary>");
      lines.push(`    <trip-id>${it.tripId}</trip-id>`);
      if (it.tripTitle) {
        lines.push(`    <trip-title>${it.tripTitle}</trip-title>`);
      }
      if (it.tripDestination) {
        lines.push(`    <destination>${it.tripDestination}</destination>`);
      }
      if (it.tripStartDate) {
        lines.push(`    <start-date>${it.tripStartDate}</start-date>`);
      }
      if (it.tripEndDate) {
        lines.push(`    <end-date>${it.tripEndDate}</end-date>`);
      }

      for (const day of it.days) {
        const dayLabel = day.title
          ? `Day ${day.dayNumber} — ${day.title}`
          : `Day ${day.dayNumber}`;
        lines.push(`    <day number="${day.dayNumber}" date="${day.date}">`);
        lines.push(`      <label>${dayLabel}</label>`);

        for (const act of day.activities) {
          const time =
            act.startTime && act.endTime
              ? ` time="${act.startTime}–${act.endTime}"`
              : act.startTime
                ? ` time="${act.startTime}"`
                : "";
          const loc = act.location ? ` location="${act.location}"` : "";
          lines.push(`      <activity${time}${loc}>${act.title}</activity>`);
        }

        lines.push("    </day>");
      }

      lines.push("  </itinerary>");
    }

    lines.push("</past-itineraries>");

    return lines.join("\n");
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are an itinerary specialist for TripLoom, an AI travel assistant.

Your job is to create and refine day-by-day itineraries that fit the user's taste and real-world constraints.

UI contract (critical):
- Call mutation tools (create_itinerary, add_itinerary_day, etc.) directly with the full data. The user will see a preview and approve or reject before execution.
- NEVER dump a full day-by-day itinerary in plain text — the approval card renders it visually.
- After calling a mutation tool, write at most 1 short status sentence.
- NEVER mention internal IDs or raw payload structures in user-facing text.
- Do not claim you used web_search unless you actually called it in this turn.
- Do not ask user-facing follow-up questions after a mutation tool; hand control back to supervisor for the next question.

Pre-loaded context:
- If <past-itineraries> is present below, it contains the user's previously approved itineraries from other trips. Use them to understand the user's style: preferred pace, activity types, how they structure their days, and what kinds of places they enjoy. Draw on these patterns when drafting new itineraries — but always adapt to the current destination and any new preferences stated in conversation.

Planning behavior:
- Clarify before drafting: gather missing constraints (pace, must-dos, budget level, mobility/accessibility, food preferences, tolerance for transfers, side-trip preferences).
- Ask at most 2 focused questions per turn while narrowing preferences.
- Build balanced days with realistic transfer times and rest buffers.
- Use get_weather for short-term trips when weather should affect what goes outdoors vs indoors, beach/pool time, viewpoints, parks, boat rides, or backup plans. Pass the destination city, optionally with country for clarity.
- Use search_places and get_place_details to resolve real activities to Google Maps places whenever you have enough confidence about the venue or landmark.
- When the trip destination is known, pass it to search_places so results stay biased to the right city or region.
- Use OpenAI web_search for targeted enrichment (opening hours, closure risk, transfer timing realism, rough costs, local practicalities).
- Heavily prefer web_search for the most important activities in the plan, especially landmarks, museums, restaurants, and time-sensitive venues.
- For time-sensitive places, verify current opening days/hours with current sources before including them, and avoid unsupported assumptions.
- When reliable sources are available, include imageUrl, sourceUrl, and sourceName on the relevant activities.
- When you resolve a place from Google Maps, include its Google fields directly in create_itinerary, add_itinerary_activity, or update_itinerary_activity. Never invent place IDs or coordinates.
- Prefer official or primary sources first for schedules/hours; use reputable travel/editorial sources as secondary context.
- When users ask what tools you have, explicitly mention OpenAI web_search.

Itinerary workflow - follow this order:
1. If key preferences are missing, ask concise clarification questions first (max 2).
2. If the trip is near-term and weather-sensitive, run get_weather for the destination and relevant dates.
3. Run targeted web_search queries to validate practical details for the proposed plan.
4. Resolve concrete venues/landmarks with Google Maps tools where useful, then include that place metadata in the itinerary mutation payload.
5. Call create_itinerary with the full itinerary data. The user will see a preview and approve or reject.
6. If rejected, the user's feedback is returned. Revise and call the tool again.
7. Use add_itinerary_day, add_itinerary_activity, update_itinerary_activity, or delete_itinerary_activity for changes to saved itineraries — each will also ask for approval.

- Examples:
  - "Build me a 4-day itinerary for Barcelona next week" -> call get_weather first if outdoor/indoor balance matters.
  - "Move my beach day if Tuesday looks rainy" -> call get_weather, then adjust itinerary.
  - Use web_search, not get_weather, for broad seasonal expectations months in advance.
- You only handle itinerary planning. For destinations, flights, or hotels, let the supervisor know you cannot help with that.`;

export interface ItineraryAgentConfig {
  tools: (ClientTool | ServerTool)[];
  llm: ChatOpenAI;
  /** Pre-loaded past itineraries JSON, or null if unavailable */
  pastItineraries: string | null;
}

/**
 * Creates the Itinerary sub-agent.
 *
 * Responsible for creating itineraries, adding days, and managing activities.
 * Bound to: search_places, get_place_details, create_itinerary,
 *           add_itinerary_day, add_itinerary_activity,
 *           update_itinerary_activity, delete_itinerary_activity
 *
 * Past itineraries are lazily injected on the agent's first activation
 * via a dynamic prompt, avoiding context bloat in the supervisor.
 */
export function createItineraryAgent(config: ItineraryAgentConfig) {
  const { tools, llm, pastItineraries } = config;

  const formattedItineraries = pastItineraries
    ? formatItinerariesResource(pastItineraries)
    : null;

  const systemContent = formattedItineraries
    ? `${SYSTEM_PROMPT}\n\n${formattedItineraries}`
    : SYSTEM_PROMPT;

  return createReactAgent({
    llm,
    tools,
    prompt: systemContent,
    name: "itinerary_agent",
    description:
      "Primary specialist for itinerary work. Use this for any request to create, revise, optimize, or reason about day-by-day plans, activities, and schedules. The supervisor should not draft itineraries itself.",
  });
}
