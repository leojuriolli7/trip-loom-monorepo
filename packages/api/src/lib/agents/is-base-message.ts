import type { BaseMessage } from "@langchain/core/messages";

export function isBaseMessage(value: unknown): value is BaseMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof Reflect.get(value, "toDict") === "function";
}
