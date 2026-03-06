"use client";

import type { TripLoomMessage } from "@trip-loom/agents";
import { requestPaymentToolResultSchema } from "@trip-loom/contracts/dto";
import { RequestPaymentToolResultCard } from "../request-payment-tool-result-card";

type ToolMessageRendererProps = {
  message: Extract<TripLoomMessage, { type: "tool" }>;
  tripId: string;
};

/**
 * Tool result messages can store content as either a plain string or structured
 * content parts. This normalizes them to the text payload we persist.
 */
function getToolMessageTextContent(content: TripLoomMessage["content"]) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/**
 * `request_payment` writes a structured JSON result into the persisted tool
 * message. This parser keeps the message-rendering layer responsible only for
 * extracting and validating that stored result.
 */
function parseRequestPaymentResult(content: TripLoomMessage["content"]) {
  const textContent = getToolMessageTextContent(content);

  if (!textContent) {
    return null;
  }

  try {
    const parsedContent = JSON.parse(textContent);
    const parsed = requestPaymentToolResultSchema.safeParse(parsedContent);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Renders persisted `tool` messages from chat history.
 *
 * This is intentionally separate from assistant `tool_calls`:
 * - assistant tool calls are previews attached to an AI message
 * - tool messages are the saved outputs produced after a tool finishes
 * - live approval/payment prompts render from `stream.interrupts`
 */
export function ToolMessageRenderer({
  message,
  tripId,
}: ToolMessageRendererProps) {
  if (message.name !== "request_payment") {
    return null;
  }

  const parsed = parseRequestPaymentResult(message.content);

  if (!parsed) {
    return null;
  }

  return <RequestPaymentToolResultCard result={parsed} tripId={tripId} />;
}
