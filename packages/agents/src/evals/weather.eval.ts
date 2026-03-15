/**
 * Weather tool ownership evals — verify the supervisor correctly decides
 * whether to call get_weather itself or delegate to destination_agent.
 */

import { describeEval, ToolCallScorer } from "vitest-evals";
import { SupervisorRunner, FRESH_TRIP_SYSTEM_MESSAGES } from "./utils";

describeEval("weather — supervisor handles forecast directly", {
  data: async () => [
    {
      name: "rain forecast question",
      input: "Will it rain in Paris next weekend?",
      expectedTools: [{ name: "get_weather" }],
    },
    {
      name: "compare weather for two cities",
      input: "Between Lisbon and Barcelona, which will be sunnier next week?",
      expectedTools: [{ name: "get_weather" }, { name: "get_weather" }],
    },
  ],
  task: SupervisorRunner({ history: FRESH_TRIP_SYSTEM_MESSAGES }),
  scorers: [ToolCallScorer({ params: "fuzzy" })],
  threshold: 0.6,
  timeout: 60_000,
});

describeEval("weather — climate question goes to destination_agent", {
  data: async () => [
    {
      name: "best season question (not forecast)",
      input: "What's the best season to visit Bali?",
      expectedTools: [{ name: "transfer_to_destination_agent", arguments: {} }],
    },
  ],
  task: SupervisorRunner({ history: FRESH_TRIP_SYSTEM_MESSAGES }),
  scorers: [ToolCallScorer({ params: "fuzzy" })],
  threshold: 0.8,
  timeout: 60_000,
});
