import type { ChatInputMessage, ChatStreamInput } from "../../dto/chat";

export function extractMessageFromInput(
  input: ChatStreamInput | null | undefined,
): ChatInputMessage | undefined {
  if (!input) {
    return undefined;
  }

  const { messages } = input;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      (message.type === "human" || message.type === "user") &&
      message.content.trim()
    ) {
      return {
        ...message,
        content: message.content.trim(),
        id: message.id && message.id.length > 0 ? message.id : undefined,
      };
    }
  }

  return undefined;
}
