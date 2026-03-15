/**
 * Routing evals — verify the supervisor delegates to the correct sub-agent.
 *
 * These test the "hard routing rules" from the supervisor prompt:
 * destination discovery → destination_agent, flights → flight_agent, etc.
 */

import { describeEval, ToolCallScorer } from "vitest-evals";
import {
  SupervisorRunner,
  FRESH_TRIP_SYSTEM_MESSAGES,
  TRIP_WITH_DATES_SYSTEM_MESSAGES,
} from "./utils";

// ---------------------------------------------------------------------------
// Destination routing
// ---------------------------------------------------------------------------

describeEval("routing — destination discovery", {
  data: async () => [
    {
      name: "recommend warm destinations",
      input: "Recommend warm beach destinations for a March trip.",
      expectedTools: [{ name: "transfer_to_destination_agent", arguments: {} }],
    },
    {
      name: "compare two cities",
      input:
        "I'm choosing between Lisbon and Barcelona. Which is better for food and architecture?",
      expectedTools: [{ name: "transfer_to_destination_agent", arguments: {} }],
    },
    {
      name: "best time to visit",
      input: "What's the best time to visit Japan?",
      expectedTools: [{ name: "transfer_to_destination_agent", arguments: {} }],
    },
    {
      name: "neighborhood vibe question",
      input: "What are the most walkable neighborhoods in Rome?",
      expectedTools: [{ name: "transfer_to_destination_agent", arguments: {} }],
    },
  ],
  task: SupervisorRunner({ history: FRESH_TRIP_SYSTEM_MESSAGES }),
  scorers: [ToolCallScorer({ params: "fuzzy" })],
  threshold: 0.8,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Flight routing
// ---------------------------------------------------------------------------

describeEval("routing — flight search", {
  data: async () => [
    {
      name: "flight search with airport known",
      input: "Find me flights from JFK to Barcelona, March 25 to March 30.",
      expectedTools: [{ name: "transfer_to_flight_agent", arguments: {} }],
    },
  ],
  task: SupervisorRunner({
    history: TRIP_WITH_DATES_SYSTEM_MESSAGES,
    tripHasDates: true,
  }),
  scorers: [ToolCallScorer({ params: "fuzzy" })],
  threshold: 0.8,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Hotel routing
// ---------------------------------------------------------------------------

describeEval("routing — hotel search", {
  data: async () => [
    {
      name: "hotel search with dates/destination known",
      input: "Find me a nice hotel in Barcelona with a rooftop pool.",
      expectedTools: [{ name: "transfer_to_hotel_agent" }],
    },
  ],
  task: SupervisorRunner({
    history: TRIP_WITH_DATES_SYSTEM_MESSAGES,
    tripHasDates: true,
  }),
  scorers: [ToolCallScorer({ params: "fuzzy" })],
  threshold: 0.6,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Itinerary routing
// ---------------------------------------------------------------------------

describeEval("routing — itinerary planning", {
  data: async () => [
    {
      name: "plan activities for trip",
      input:
        "Plan 3 days of activities in Barcelona. I love architecture and food tours.",
      expectedTools: [{ name: "transfer_to_itinerary_agent", arguments: {} }],
    },
  ],
  task: SupervisorRunner({
    history: TRIP_WITH_DATES_SYSTEM_MESSAGES,
    tripHasDates: true,
  }),
  scorers: [ToolCallScorer({ params: "fuzzy" })],
  threshold: 0.8,
  timeout: 60_000,
});
