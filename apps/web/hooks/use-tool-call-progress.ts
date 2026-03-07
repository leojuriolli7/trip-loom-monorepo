import { useChatStream } from "@/context/chat";

/**
 * Returns the streaming progress state for a specific tool call.
 *
 * Uses `stream.toolCalls` (paired tool calls with results and state)
 * to determine if a tool call is still pending.
 *
 * When viewing persisted history (no active stream), `toolCalls` won't
 * contain the entry, so `isInProgress` defaults to `false`.
 */
export function useToolCallProgress(toolCallId: string | undefined) {
  const { stream } = useChatStream();

  const entry = toolCallId
    ? stream.toolCalls?.find((t) => t.id === toolCallId)
    : undefined;

  return {
    isInProgress: entry?.state === "pending",
    state: entry?.state ?? null,
  };
}
