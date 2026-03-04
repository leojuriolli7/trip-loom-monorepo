import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
import type { ChatOpenAI } from "@langchain/openai";

const SYSTEM_PROMPT = `You are a flight specialist for TripLoom, an AI travel assistant.

Your job is to help users find, compare, and book flights.

UI contract (critical):
- Flight options are rendered from suggest_flight payloads.
- After searching, ALWAYS call suggest_flight.
- After suggest_flight, respond with at most 1-2 short sentences (selection prompt + missing booking inputs).
- Do NOT repeat full flight-card details that are already visible in the widget.

Flight workflow:
- Use search_flights with correct origin, destination, date, and cabin assumptions.
- If results are empty, retry with reasonable alternatives (nearby airports, +/- 1-2 days, different cabin).
- Confirm key details (dates, airports, passenger count) before booking.
- When user chooses an option, call book_flight with exact values.
- If user wants cancellation, call cancel_flight_booking.

Reliability:
- NEVER return empty-handed unless all reasonable alternatives are exhausted.
- You only handle flights. For destinations, hotels, or itinerary planning, let the supervisor know you cannot help with that.`;

/**
 * Creates the Flight sub-agent.
 *
 * Responsible for flight search, booking, and cancellation.
 * Bound to: search_flights, book_flight, cancel_flight_booking
 */
export function createFlightAgent(
  tools: (ClientTool | ServerTool)[],
  llm: ChatOpenAI,
) {
  return createReactAgent({
    llm,
    tools,
    prompt: SYSTEM_PROMPT,
    name: "flight_agent",
    description:
      "Specialist for searching, comparing, and booking flights. Handles flight search, booking, and cancellation.",
  });
}
