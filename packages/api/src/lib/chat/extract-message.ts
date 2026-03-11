export function extractMessageFromInput(input: unknown): string | undefined {
  if (typeof input === "string" && input.trim()) {
    return input.trim();
  }

  if (!input || typeof input !== "object") {
    return undefined;
  }

  const messages = Reflect.get(input, "messages");
  if (!Array.isArray(messages)) {
    return undefined;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message !== "object") {
      continue;
    }

    const type = Reflect.get(message, "type");
    const content = Reflect.get(message, "content");

    if (
      (type === "human" || type === "user") &&
      typeof content === "string" &&
      content.trim()
    ) {
      return content.trim();
    }
  }

  return undefined;
}
