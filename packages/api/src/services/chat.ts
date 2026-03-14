import { getOrCreateAgentToken } from "../lib/agents/token";
import { createGraph, getThreadState, Command } from "@trip-loom/agents";
import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { NotFoundError } from "../errors";
import { mapChatMessages } from "../mappers/chat";
import type { ChatHistoryResponse, ChatInputMessage } from "../dto/chat";
import { getOwnedTripMeta } from "../lib/trips/ownership";
import { getAgentsConfig } from "../lib/agents/config";
import { isBaseMessage } from "../lib/agents/is-base-message";
import {
  formatPreferencesResource,
  formatTripsResource,
} from "../lib/chat/format-resources";

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

function buildResourceContextMessage(resources: {
  userTrips: string | null;
  userPreferences: string | null;
}): SystemMessage | null {
  const sections: string[] = [];

  if (resources.userPreferences) {
    const formatted = formatPreferencesResource(resources.userPreferences);
    if (formatted) sections.push(formatted);
  }

  if (resources.userTrips) {
    const formatted = formatTripsResource(resources.userTrips);
    if (formatted) sections.push(formatted);
  }

  if (sections.length === 0) return null;

  return new SystemMessage(
    `User context loaded from MCP resources:\n\n${sections.join("\n\n")}`,
  );
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
  message: ChatInputMessage,
  resources: { userTrips: string | null; userPreferences: string | null },
): Promise<{ messages: BaseMessage[] }> {
  const threadState = await getThreadState(databaseUrl, threadId);

  if (hasPersistedMessages(threadState)) {
    return {
      messages: [
        new HumanMessage({ content: message.content, id: message.id }),
      ],
    };
  }

  // Inject trip context + MCP resources only at conversation start.
  const messages: BaseMessage[] = [buildTripContextMessage(tripId)];

  const resourceMsg = buildResourceContextMessage(resources);

  if (resourceMsg) {
    messages.push(resourceMsg);
  }

  messages.push(new HumanMessage({ content: message.content, id: message.id }));

  return { messages };
}

/**
 * Creates a LangGraph-native SSE stream for the given trip + user input.
 */
export async function streamChatResponse(
  userId: string,
  tripId: string,
  message: ChatInputMessage,
): Promise<{ stream: ReadableStream; threadId: string }> {
  const { mcpServerUrl, databaseUrl } = getAgentsConfig();
  const ownsTrip = await getOwnedTripMeta(userId, tripId);

  if (!ownsTrip) {
    throw new NotFoundError("Trip not found");
  }
  const threadId = getThreadIdForTrip(tripId);
  const accessToken = await getOrCreateAgentToken(userId);

  const { graph, mcpClient, mcpResources } = await createGraph({
    mcpUrl: mcpServerUrl,
    accessToken,
    dbConnectionString: databaseUrl,
  });

  const input = await buildChatInput(
    databaseUrl,
    threadId,
    tripId,
    message,
    mcpResources,
  );

  const rawStream = await graph.stream(input, {
    encoding: "text/event-stream",
    streamMode: ["values", "messages", "tools"],
    configurable: { thread_id: threadId },
    recursionLimit: 100,
    metadata: { tripId, userId, threadId },
    tags: ["chat", `trip:${tripId}`],
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
    metadata: { tripId, userId, threadId },
    tags: ["chat:resume", `trip:${tripId}`],
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
  const { databaseUrl } = getAgentsConfig();
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
