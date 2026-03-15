/**
 * State management evals — verify the supervisor updates trip state
 * BEFORE delegating to sub-agents.
 *
 * Tests pronoun resolution, destination locking, date interpretation,
 * and title generation.
 */

import { describeEval, ToolCallScorer } from "vitest-evals";
import { AIMessage } from "@langchain/core/messages";
import {
  SupervisorRunner,
  ToolSequenceScorer,
  FIXTURES,
  DESTINATION_RESULTS_HISTORY,
  FRESH_TRIP_SYSTEM_MESSAGES,
} from "./utils";

// ---------------------------------------------------------------------------
// Update destination before delegation
// ---------------------------------------------------------------------------

describeEval("state — update destination then ask for dates", {
  data: async () => [
    {
      name: "explicit destination choice + hotel request (no dates yet)",
      input: "Let's go with Barcelona. Now find me hotels.",
      // Trip has no dates, so supervisor should update destination but NOT
      // transfer to hotel_agent yet — it should ask for dates first.
      expectedToolSequence: [
        {
          name: "update_trip",
          arguments: { destinationId: FIXTURES.barcelonaDestinationId },
        },
      ],
    },
  ],
  task: SupervisorRunner({ history: DESTINATION_RESULTS_HISTORY }),
  scorers: [ToolSequenceScorer()],
  threshold: 0.6,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Pronoun resolution — "there" → extract destinationId from history
// ---------------------------------------------------------------------------

describeEval("state — destination resolution before hotel delegation", {
  data: async () => [
    {
      name: "explicit city name triggers update_trip + hotel transfer",
      input: "Look up hotels in Barcelona.",
      expectedTools: [
        {
          name: "update_trip",
          arguments: { destinationId: FIXTURES.barcelonaDestinationId },
        },
        { name: "transfer_to_hotel_agent", arguments: {} },
      ],
      expectedToolSequence: [
        {
          name: "update_trip",
          arguments: { destinationId: FIXTURES.barcelonaDestinationId },
        },
        { name: "transfer_to_hotel_agent" },
      ],
    },
  ],
  task: SupervisorRunner({ history: DESTINATION_RESULTS_HISTORY }),
  scorers: [
    ToolCallScorer({ ordered: true, params: "fuzzy" }),
    ToolSequenceScorer(),
  ],
  threshold: 0.6,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Title generation when locking destination
// ---------------------------------------------------------------------------

describeEval("state — title generation on destination lock", {
  data: async () => [
    {
      name: "choosing Barcelona should generate a title",
      input: "Barcelona looks perfect. Let's go with that one.",
      // We don't know the exact title, but update_trip must be called
      // with BOTH destinationId and a non-empty title
      expectedToolSequence: [
        {
          name: "update_trip",
          arguments: { destinationId: FIXTURES.barcelonaDestinationId },
        },
      ],
    },
  ],
  task: SupervisorRunner({ history: DESTINATION_RESULTS_HISTORY }),
  scorers: [ToolSequenceScorer()],
  threshold: 0.6,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// Date update before delegation
// ---------------------------------------------------------------------------

describeEval("state — update dates before delegation", {
  data: async () => [
    {
      name: "user provides dates then asks for flights",
      input:
        "I want to go March 25 to March 30. Can you find me flights from JFK?",
      expectedToolSequence: [
        {
          name: "update_trip",
          arguments: { startDate: "2026-03-25", endDate: "2026-03-30" },
        },
        { name: "transfer_to_flight_agent" },
      ],
    },
  ],
  task: SupervisorRunner({
    history: [
      ...FRESH_TRIP_SYSTEM_MESSAGES,
      new AIMessage({
        content: "Great, I've set Barcelona as your destination!",
        name: "supervisor",
      }),
    ],
  }),
  scorers: [ToolSequenceScorer()],
  threshold: 0.6,
  timeout: 60_000,
});
