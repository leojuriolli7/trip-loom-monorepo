import { getOrCreateAgentToken } from "../lib/agents/token";
import { createGraph, getThreadState, Command } from "@trip-loom/agents";
import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { NotFoundError } from "../errors";
import { mapChatMessages } from "../mappers/chat";
import type { ChatHistoryResponse } from "../dto/chat";
import { getOwnedTripMeta } from "../lib/trips/ownership";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL;
const DATABASE_URL = process.env.DATABASE_URL;

function buildTripContextMessage(tripId: string): SystemMessage {
  return new SystemMessage(
    [
      "Internal conversation context for TripLoom agents.",
      `Current active trip ID: ${tripId}.`,
      "For trip-scoped actions and lookups, use this trip ID by default.",
      "Do not ask the user for trip ID unless they explicitly want to switch trips.",
    ].join("\n"),
  );
}

function getAgentsConfig() {
  if (!MCP_SERVER_URL) {
    throw new Error("MCP_SERVER_URL is required for chat streaming");
  }

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required for chat streaming");
  }

  return {
    mcpServerUrl: MCP_SERVER_URL,
    databaseUrl: DATABASE_URL,
  };
}

function getDatabaseUrl() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required for chat history");
  }

  return DATABASE_URL;
}

function isBaseMessage(value: unknown): value is BaseMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof Reflect.get(value, "toDict") === "function";
}

/**
 * Wraps a stream and guarantees cleanup runs after close/cancel.
 */
function withCleanup(
  sourceStream: ReadableStream,
  cleanup: () => Promise<void>,
): ReadableStream {
  const reader = sourceStream.getReader();
  let cleanedUp = false;

  const runCleanup = async () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    await cleanup();
  };

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          await runCleanup();
          controller.close();
          return;
        }

        controller.enqueue(value);
      } catch (err) {
        await runCleanup();
        controller.error(err);
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        await runCleanup();
      }
    },
  });
}

/**
 * In TripLoom, each trip has exactly one conversation thread.
 * We use the trip ID itself as the thread ID.
 */
function getThreadIdForTrip(tripId: string): string {
  return tripId;
}

function hasPersistedMessages(
  threadState: Awaited<ReturnType<typeof getThreadState>>,
): boolean {
  const values = threadState?.checkpoint?.channel_values;
  return Array.isArray(values?.messages) && values.messages.length > 0;
}

async function buildChatInput(
  databaseUrl: string,
  threadId: string,
  tripId: string,
  message: string,
): Promise<{ messages: BaseMessage[] }> {
  const threadState = await getThreadState(databaseUrl, threadId);

  if (hasPersistedMessages(threadState)) {
    return { messages: [new HumanMessage(message)] };
  }

  // Inject trip context only at conversation start, not on every turn.
  return {
    messages: [buildTripContextMessage(tripId), new HumanMessage(message)],
  };
}

/**
 * Creates a LangGraph-native SSE stream for the given trip + user input.
 */
export async function streamChatResponse(
  userId: string,
  tripId: string,
  message: string,
): Promise<{ stream: ReadableStream; threadId: string }> {
  const { mcpServerUrl, databaseUrl } = getAgentsConfig();
  const ownsTrip = await getOwnedTripMeta(userId, tripId);

  if (!ownsTrip) {
    throw new NotFoundError("Trip not found");
  }
  const threadId = getThreadIdForTrip(tripId);
  const accessToken = await getOrCreateAgentToken(userId);

  const { graph, mcpClient } = await createGraph({
    mcpUrl: mcpServerUrl,
    accessToken,
    dbConnectionString: databaseUrl,
  });

  const input = await buildChatInput(databaseUrl, threadId, tripId, message);

  const rawStream = await graph.stream(input, {
    encoding: "text/event-stream",
    streamMode: ["values", "messages", "tools"],
    configurable: { thread_id: threadId },
    recursionLimit: 100,
  });

  return {
    stream: withCleanup(rawStream, () => mcpClient.close()),
    threadId,
  };
}

/**
 * Resumes a paused graph (after an interrupt) with the user's response.
 * Used when the user confirms/denies an action or completes payment.
 */
export async function resumeChatResponse(
  userId: string,
  tripId: string,
  resumeData: unknown,
): Promise<{ stream: ReadableStream; threadId: string }> {
  const { mcpServerUrl, databaseUrl } = getAgentsConfig();
  const ownsTrip = await getOwnedTripMeta(userId, tripId);

  if (!ownsTrip) {
    throw new NotFoundError("Trip not found");
  }
  const threadId = getThreadIdForTrip(tripId);
  const accessToken = await getOrCreateAgentToken(userId);

  const { graph, mcpClient } = await createGraph({
    mcpUrl: mcpServerUrl,
    accessToken,
    dbConnectionString: databaseUrl,
  });

  const rawStream = await graph.stream(new Command({ resume: resumeData }), {
    encoding: "text/event-stream",
    streamMode: ["values", "messages", "tools"],
    configurable: { thread_id: threadId },
    recursionLimit: 100,
  });

  return {
    stream: withCleanup(rawStream, () => mcpClient.close()),
    threadId,
  };
}

/**
 * Loads past chat messages from the LangGraph checkpointer for a trip.
 * Returns an empty array if no conversation has started yet.
 */
export async function getChatHistory(
  userId: string,
  tripId: string,
): Promise<ChatHistoryResponse> {
  const databaseUrl = getDatabaseUrl();
  const ownsTrip = await getOwnedTripMeta(userId, tripId);

  if (!ownsTrip) {
    throw new NotFoundError("Trip not found");
  }
  const threadState = await getThreadState(
    databaseUrl,
    getThreadIdForTrip(tripId),
  );

  if (!threadState?.checkpoint) {
    return { messages: [] };
  }

  const values = threadState.checkpoint.channel_values;
  const rawMessages = Array.isArray(values?.messages)
    ? values.messages.filter(isBaseMessage)
    : [];

  return { messages: mapChatMessages(rawMessages) };
}
