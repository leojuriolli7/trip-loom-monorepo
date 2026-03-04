import type { BaseMessage, StoredMessage } from "@langchain/core/messages";
import { TRIP_LOOM_TOOL_NAMES } from "@trip-loom/agents";
import { chatMessageSchema, type ChatMessageDTO } from "../dto/chat";

const TRIP_LOOM_TOOL_NAME_SET = new Set<string>(TRIP_LOOM_TOOL_NAMES);

function sanitizeStoredMessage(stored: StoredMessage): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: stored.type,
    ...stored.data,
  };

  if (stored.type !== "ai") {
    return payload;
  }

  const toolCalls = payload.tool_calls;
  if (!Array.isArray(toolCalls)) {
    return payload;
  }

  payload.tool_calls = toolCalls.filter((toolCall) => {
    if (typeof toolCall !== "object" || toolCall === null) {
      return false;
    }

    const name = Reflect.get(toolCall, "name");
    return typeof name === "string" && TRIP_LOOM_TOOL_NAME_SET.has(name);
  });

  return payload;
}

function flattenStoredMessage(stored: StoredMessage): ChatMessageDTO {
  return chatMessageSchema.parse(sanitizeStoredMessage(stored));
}

export function mapChatMessages(messages: BaseMessage[]): ChatMessageDTO[] {
  return messages.map((message) => flattenStoredMessage(message.toDict()));
}
