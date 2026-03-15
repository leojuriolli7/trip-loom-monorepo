/**
 * Task runners for TripLoom agent evaluations.
 *
 * Uses the real supervisor graph (buildSupervisor) with mock tools and
 * mock sub-agents. The graph loops naturally, so multi-step sequences
 * like update_trip → transfer_to_hotel_agent work correctly.
 */

import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { AIMessage } from "@langchain/core/messages";
import type { TaskResult } from "vitest-evals";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { z } from "zod";
import { buildSupervisor } from "../../supervisor";
import { createModel, modelConfig } from "../../config";
import { MOCK_TOOL_RESPONSES } from "./fixtures";

// ---------------------------------------------------------------------------
// Mock tools — same schemas as production, return canned responses
// ---------------------------------------------------------------------------

const mockGetTripDetails = tool(
  async () => MOCK_TOOL_RESPONSES.get_trip_details,
  {
    name: "get_trip_details",
    description:
      "Retrieve full details for a specific trip by its ID. Returns trip info with destination, bookings, itinerary, and payments.",
    schema: z.object({
      tripId: z.string().describe("The unique trip ID"),
    }),
  },
);

const mockGetTripDetailsWithDates = tool(
  async () => MOCK_TOOL_RESPONSES.get_trip_details_with_dates,
  {
    name: "get_trip_details",
    description:
      "Retrieve full details for a specific trip by its ID. Returns trip info with destination, bookings, itinerary, and payments.",
    schema: z.object({
      tripId: z.string().describe("The unique trip ID"),
    }),
  },
);

const mockUpdateTrip = tool(async () => MOCK_TOOL_RESPONSES.update_trip, {
  name: "update_trip",
  description:
    "Update an existing trip by ID. Supports updating destination, title, and dates.",
  schema: z.object({
    tripId: z.string().describe("The unique trip ID"),
    destinationId: z
      .string()
      .optional()
      .describe("Destination ID to associate with the trip"),
    title: z.string().optional().describe("Trip title"),
    startDate: z
      .string()
      .optional()
      .describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
  }),
});

const mockGetUserPreferences = tool(
  async () => MOCK_TOOL_RESPONSES.get_user_preferences,
  {
    name: "get_user_preferences",
    description: "Retrieve the authenticated user's travel preferences.",
    schema: z.object({}),
  },
);

const mockGetWeather = tool(async () => MOCK_TOOL_RESPONSES.get_weather, {
  name: "get_weather",
  description:
    "Get forecast weather for a city and date range. Provide a city name plus startDate and optional endDate.",
  schema: z.object({
    city: z.string(),
    startDate: z.string().describe("YYYY-MM-DD"),
    endDate: z.string().optional().describe("YYYY-MM-DD"),
  }),
});

const mockSuggestNewTrip = tool(
  async () => MOCK_TOOL_RESPONSES.suggest_new_trip,
  {
    name: "suggest_new_trip",
    description:
      "Present a new trip draft card. Use ONLY for a genuinely new trip when the current trip is past/cancelled.",
    schema: z.object({
      title: z.string().nullable(),
      destinationId: z.string().nullable(),
      destinationName: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    }),
  },
);

const DEFAULT_SUPERVISOR_TOOLS = [
  mockGetTripDetails,
  mockUpdateTrip,
  mockGetUserPreferences,
  mockGetWeather,
  mockSuggestNewTrip,
];

// ---------------------------------------------------------------------------
// Mock sub-agents — immediately return and transfer back to supervisor
// ---------------------------------------------------------------------------

function createMockSubAgent(name: string) {
  const noopTool = tool(async () => `${name} completed the task.`, {
    name: `${name}_noop`,
    description: "No-op tool for mock agent",
    schema: z.object({}),
  });

  return createReactAgent({
    llm: new FakeListChatModel({ responses: ["Task completed."] }),
    tools: [noopTool],
    name,
  });
}

const MOCK_AGENTS = [
  createMockSubAgent("destination_agent"),
  createMockSubAgent("flight_agent"),
  createMockSubAgent("hotel_agent"),
  createMockSubAgent("itinerary_agent"),
];

// ---------------------------------------------------------------------------
// Extract tool calls from the full message history
// ---------------------------------------------------------------------------

interface ExtractedToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

function extractToolCalls(messages: BaseMessage[]): ExtractedToolCall[] {
  const toolCalls: ExtractedToolCall[] = [];

  for (const msg of messages) {
    // Only extract from supervisor's AI messages
    if (msg.name !== "supervisor") continue;
    const aiMsg = msg as AIMessage;
    if (!aiMsg.tool_calls?.length) continue;

    for (const tc of aiMsg.tool_calls) {
      toolCalls.push({
        name: tc.name,
        arguments: tc.args ?? {},
      });
    }
  }

  return toolCalls;
}

function extractTextContent(messages: BaseMessage[]): string {
  // Get the last supervisor message with text content
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.name !== "supervisor") continue;

    const content = msg.content;
    if (typeof content === "string" && content.length > 0) return content;
    if (Array.isArray(content)) {
      const text = content
        .filter(
          (c): c is { type: "text"; text: string } =>
            typeof c === "object" &&
            c !== null &&
            "type" in c &&
            c.type === "text",
        )
        .map((c) => c.text)
        .join("\n");
      if (text.length > 0) return text;
    }
  }

  return "";
}

// ---------------------------------------------------------------------------
// Task runners
// ---------------------------------------------------------------------------

export interface SupervisorRunnerOptions {
  /** Previous conversation messages to prepend before the user input. */
  history?: BaseMessage[];
  /** Use trip-with-dates mock for get_trip_details instead of empty trip. */
  tripHasDates?: boolean;
}

/**
 * Creates a task runner that invokes the full supervisor graph.
 *
 * Uses buildSupervisor with MemorySaver + mock tools + mock sub-agents,
 * so the graph loops naturally and multi-step tool sequences work.
 */
export function SupervisorRunner(options: SupervisorRunnerOptions = {}) {
  return async function supervisorRunner(input: string): Promise<TaskResult> {
    const supervisorTools = options.tripHasDates
      ? [
          mockGetTripDetailsWithDates,
          mockUpdateTrip,
          mockGetUserPreferences,
          mockGetWeather,
          mockSuggestNewTrip,
        ]
      : DEFAULT_SUPERVISOR_TOOLS;

    const graph = buildSupervisor({
      agents: MOCK_AGENTS,
      tools: supervisorTools,
      llm: createModel(modelConfig.supervisor, { temperature: 0 }),
      checkpointer: new MemorySaver(),
      store: new InMemoryStore(),
    });

    const messages: BaseMessage[] = [
      ...(options.history ?? []),
      new HumanMessage(input),
    ];

    const result = await graph.invoke(
      { messages },
      { configurable: { thread_id: `eval-${Date.now()}` } },
    );

    const allMessages: BaseMessage[] = result.messages;
    // Skip history messages to get only the new ones
    const newMessages = allMessages.slice(messages.length);

    const toolCalls = extractToolCalls(newMessages);
    const textContent = extractTextContent(newMessages);

    return {
      result: textContent,
      toolCalls,
    };
  };
}

