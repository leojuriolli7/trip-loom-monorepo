/**
 * Blocking question evals — verify the supervisor asks for clarification
 * instead of delegating when critical info is missing.
 */

import { describeEval } from "vitest-evals";
import {
  SupervisorRunner,
  NoTransferScorer,
  LLMJudgeScorer,
  FRESH_TRIP_SYSTEM_MESSAGES,
} from "./utils";

// ---------------------------------------------------------------------------
// Missing departure airport → ask, don't transfer to flight_agent
// ---------------------------------------------------------------------------

describeEval("blocking — ask departure airport before flight delegation", {
  data: async () => [
    {
      name: "flight request without departure airport",
      input: "Find me flights to Paris in late March.",
      expectNoTransfer: true,
    },
  ],
  task: SupervisorRunner({ history: FRESH_TRIP_SYSTEM_MESSAGES }),
  scorers: [
    NoTransferScorer(),
    LLMJudgeScorer({
      criteria: `Score whether the supervisor asks the user for their departure city/airport instead of delegating.

1.0 = Asks for departure airport/city explicitly. Does NOT transfer to flight_agent.
0.5 = Asks but also makes an assumption about the departure.
0.0 = Transfers to flight_agent without asking, or doesn't ask at all.`,
    }),
  ],
  threshold: 0.6,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Missing dates → ask before hotel/itinerary delegation
// ---------------------------------------------------------------------------

describeEval("blocking — ask dates before hotel delegation", {
  data: async () => [
    {
      name: "hotel request without dates",
      input: "Book me a hotel in Rome.",
      expectNoTransfer: true,
    },
  ],
  task: SupervisorRunner({ history: FRESH_TRIP_SYSTEM_MESSAGES }),
  scorers: [
    NoTransferScorer(),
    LLMJudgeScorer({
      criteria: `Score whether the supervisor asks the user for travel dates before delegating to hotel_agent.

1.0 = Asks for dates explicitly. Does NOT transfer to hotel_agent or any other agent.
0.5 = Asks but also transfers or makes assumptions.
0.0 = Transfers to hotel_agent without asking for dates.`,
    }),
  ],
  threshold: 0.6,
  timeout: 60_000,
});
