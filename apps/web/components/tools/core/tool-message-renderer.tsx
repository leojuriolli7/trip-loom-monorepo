"use client";

import type { TripLoomMessage } from "@trip-loom/agents";
import { z } from "zod";
import {
  requestPaymentToolResultSchema,
  requestCancellationToolResultSchema,
  requestSeatSelectionToolResultSchema,
} from "@trip-loom/contracts/dto/payments";
import { hotelBookingSchema } from "@trip-loom/contracts/dto/hotel-bookings";
import { CreateHotelBookingToolResultCard } from "../create-hotel-booking-tool-result-card";
import { RequestCancellationToolResultCard } from "../request-cancellation-tool-result-card";
import { RequestPaymentToolResultCard } from "../request-payment-tool-result-card";
import { SeatSelectionToolResultCard } from "../seat-selection-tool-result-card";

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
 * Persisted tool messages store JSON inside their text content. This helper
 * keeps parsing localized to the tool-message layer so individual cards only
 * receive validated DTOs.
 */
function parseToolMessageJson<TSchema extends z.ZodTypeAny>(
  content: TripLoomMessage["content"],
  schema: TSchema,
): z.infer<TSchema> | null {
  const textContent = getToolMessageTextContent(content);

  if (!textContent) {
    return null;
  }

  try {
    // Tools return "JSON\n\nAgent instructions" — extract just the JSON portion.
    const jsonSegment = textContent.split("\n\n")[0] ?? textContent;
    const parsedContent = JSON.parse(jsonSegment);
    const parsed = schema.safeParse(parsedContent);

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
  if (message.name === "create_hotel_booking") {
    const booking = parseToolMessageJson(message.content, hotelBookingSchema);

    if (!booking) {
      return null;
    }

    return <CreateHotelBookingToolResultCard booking={booking} />;
  }

  if (message.name === "request_payment") {
    const parsed = parseToolMessageJson(
      message.content,
      requestPaymentToolResultSchema,
    );

    if (!parsed) {
      return null;
    }

    return <RequestPaymentToolResultCard result={parsed} tripId={tripId} />;
  }

  if (message.name === "request_seat_selection") {
    const parsed = parseToolMessageJson(
      message.content,
      requestSeatSelectionToolResultSchema,
    );

    if (!parsed) {
      return null;
    }

    return <SeatSelectionToolResultCard result={parsed} />;
  }

  if (message.name === "request_cancellation") {
    const parsed = parseToolMessageJson(
      message.content,
      requestCancellationToolResultSchema,
    );

    if (!parsed) {
      return null;
    }

    return (
      <RequestCancellationToolResultCard result={parsed} tripId={tripId} />
    );
  }

  return null;
}
