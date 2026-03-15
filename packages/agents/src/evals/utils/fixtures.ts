/**
 * Shared test fixtures for TripLoom agent evaluations.
 *
 * Uses LangChain message constructors for proper typing.
 */

import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

// ---------------------------------------------------------------------------
// IDs & constants
// ---------------------------------------------------------------------------

export const FIXTURES = {
  tripId: "test-trip-abc123",
  barcelonaDestinationId: "dest-barcelona-xyz",
  lisbonDestinationId: "dest-lisbon-456",
  tokyoDestinationId: "dest-tokyo-789",
  quebecDestinationId: "dest-quebec-012",
} as const;

// ---------------------------------------------------------------------------
// System messages injected at the start of every supervisor conversation
// ---------------------------------------------------------------------------

const SYSTEM_TRIP_CONTEXT = new SystemMessage(
  `Internal conversation context for TripLoom agents.
Current active trip ID: ${FIXTURES.tripId}.
For trip-scoped actions and lookups, use this trip ID by default.
Do not ask the user for trip ID unless they explicitly want to switch trips.`,
);

const SYSTEM_USER_CONTEXT = new SystemMessage(
  `User context loaded from MCP resources:

<user-preferences>
  <budget-range>upscale</budget-range>
  <preferred-cabin-class>economy</preferred-cabin-class>
  <travel-interests>culture, food, architecture</travel-interests>
  <preferred-regions>Europe, North America</preferred-regions>
</user-preferences>

<user-trips>
  <trip>
    <id>${FIXTURES.tripId}</id>
    <title></title>
    <destination></destination>
    <start-date></start-date>
    <end-date></end-date>
    <has-flights>false</has-flights>
    <has-hotel>false</has-hotel>
    <has-itinerary>false</has-itinerary>
  </trip>
</user-trips>`,
);

/**
 * Base system messages for a fresh trip with no destination/dates yet.
 */
export const FRESH_TRIP_SYSTEM_MESSAGES: BaseMessage[] = [
  SYSTEM_TRIP_CONTEXT,
  SYSTEM_USER_CONTEXT,
];

/**
 * System messages for a trip that already has dates set.
 */
export const TRIP_WITH_DATES_SYSTEM_MESSAGES: BaseMessage[] = [
  SYSTEM_TRIP_CONTEXT,
  new SystemMessage(
    `User context loaded from MCP resources:

<user-preferences>
  <budget-range>upscale</budget-range>
  <preferred-cabin-class>economy</preferred-cabin-class>
  <travel-interests>culture, food, architecture</travel-interests>
</user-preferences>

<user-trips>
  <trip>
    <id>${FIXTURES.tripId}</id>
    <title>Barcelona Spring Escape</title>
    <destination>Barcelona</destination>
    <start-date>2026-03-25</start-date>
    <end-date>2026-03-30</end-date>
    <has-flights>false</has-flights>
    <has-hotel>false</has-hotel>
    <has-itinerary>false</has-itinerary>
  </trip>
</user-trips>`,
  ),
];

// ---------------------------------------------------------------------------
// Conversation snippets for multi-turn evals
// ---------------------------------------------------------------------------

/**
 * History where destination_agent already searched and returned Barcelona
 * among the results. Used for testing pronoun resolution + update_trip.
 */
export const DESTINATION_RESULTS_HISTORY: BaseMessage[] = [
  ...FRESH_TRIP_SYSTEM_MESSAGES,
  new HumanMessage(
    "I want a 4 day late March city break from New York. Food, architecture, walkable neighborhoods.",
  ),
  new AIMessage({
    content: "",
    name: "supervisor",
    tool_calls: [
      {
        name: "transfer_to_destination_agent",
        args: {},
        id: "call_1",
        type: "tool_call",
      },
    ],
  }),
  new ToolMessage({
    content: "Successfully transferred to destination_agent",
    name: "transfer_to_destination_agent",
    tool_call_id: "call_1",
  }),
  new AIMessage({
    content: "",
    name: "destination_agent",
    tool_calls: [
      {
        name: "search_destinations",
        args: {
          search: "late March city break food architecture walkable",
          limit: 20,
        },
        id: "call_2",
        type: "tool_call",
      },
    ],
  }),
  new ToolMessage({
    content: JSON.stringify({
      data: [
        {
          id: FIXTURES.barcelonaDestinationId,
          name: "Barcelona",
          country: "Spain",
          description: "Vibrant city with stunning architecture and food scene",
        },
        {
          id: FIXTURES.lisbonDestinationId,
          name: "Lisbon",
          country: "Portugal",
          description: "Hilly city with amazing food and tile architecture",
        },
        {
          id: FIXTURES.quebecDestinationId,
          name: "Quebec City",
          country: "Canada",
          description: "European charm in North America, French cuisine",
        },
      ],
    }),
    name: "search_destinations",
    tool_call_id: "call_2",
  }),
  new AIMessage({
    content: "",
    name: "destination_agent",
    tool_calls: [
      {
        name: "suggest_destinations",
        args: {
          destinations: [
            {
              destinationId: FIXTURES.barcelonaDestinationId,
              name: "Barcelona",
              highlights: ["Gaudí architecture", "La Boqueria food market"],
            },
            {
              destinationId: FIXTURES.lisbonDestinationId,
              name: "Lisbon",
              highlights: ["Alfama neighborhood", "Pastéis de Belém"],
            },
            {
              destinationId: FIXTURES.quebecDestinationId,
              name: "Quebec City",
              highlights: ["Old Quebec", "French cuisine"],
            },
          ],
        },
        id: "call_3",
        type: "tool_call",
      },
    ],
  }),
  new ToolMessage({
    content: "Destinations suggested to user",
    name: "suggest_destinations",
    tool_call_id: "call_3",
  }),
  new AIMessage({
    content:
      "Here are three great options for your late March city break from New York.",
    name: "destination_agent",
    tool_calls: [
      {
        name: "transfer_back_to_supervisor",
        args: {},
        id: "call_4",
        type: "tool_call",
      },
    ],
  }),
  new ToolMessage({
    content: "Successfully transferred to supervisor",
    name: "transfer_back_to_supervisor",
    tool_call_id: "call_4",
  }),
  new AIMessage({
    content: "Which of these cities appeals to you most?",
    name: "supervisor",
  }),
];

// ---------------------------------------------------------------------------
// Mock tool responses (used by the full graph runner)
// ---------------------------------------------------------------------------

export const MOCK_TOOL_RESPONSES = {
  get_trip_details: JSON.stringify({
    id: FIXTURES.tripId,
    title: null,
    destinationId: null,
    destinationName: null,
    startDate: null,
    endDate: null,
    flights: [],
    hotels: [],
    itinerary: null,
  }),
  get_trip_details_with_dates: JSON.stringify({
    id: FIXTURES.tripId,
    title: "Barcelona Spring Escape",
    destinationId: FIXTURES.barcelonaDestinationId,
    destinationName: "Barcelona",
    startDate: "2026-03-25",
    endDate: "2026-03-30",
    flights: [],
    hotels: [],
    itinerary: null,
  }),
  update_trip: JSON.stringify({ success: true }),
  get_user_preferences: JSON.stringify({
    budgetRange: "upscale",
    preferredCabinClass: "economy",
    travelInterests: ["culture", "food", "architecture"],
    preferredRegions: ["Europe", "North America"],
  }),
  get_weather: JSON.stringify({
    city: "Paris",
    forecast: [
      { date: "2026-03-20", high: 14, low: 7, condition: "Partly cloudy" },
      { date: "2026-03-21", high: 12, low: 6, condition: "Light rain" },
    ],
  }),
  suggest_new_trip: JSON.stringify({ success: true }),
} as const;
