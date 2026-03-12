"use client";

import type { TripLoomMessage } from "@trip-loom/agents";
import { z } from "zod";
import {
  flightBookingPaymentOutcomeSchema,
  hotelBookingPaymentOutcomeSchema,
} from "@trip-loom/contracts/dto/booking-payment-flow";
import { weatherResponseSchema } from "@trip-loom/contracts/dto/weather";
import { BookingPaymentResultCard } from "../booking-payment-result-card";
import { GetWeatherToolCard } from "../weather-tool-card/weather-tool-card";

type ToolMessageRendererProps = {
  message: Extract<TripLoomMessage, { type: "tool" }>;
  className?: string;
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
    const parsed = schema.safeParse(JSON.parse(jsonSegment));

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
  className,
}: ToolMessageRendererProps) {
  if (message.name === "create_flight_booking") {
    const paidResult = parseToolMessageJson(
      message.content,
      flightBookingPaymentOutcomeSchema,
    );

    if (paidResult) {
      return <BookingPaymentResultCard result={paidResult} className={className} />;
    }

    return null;
  }

  if (message.name === "create_hotel_booking") {
    const paidResult = parseToolMessageJson(
      message.content,
      hotelBookingPaymentOutcomeSchema,
    );

    if (paidResult) {
      return <BookingPaymentResultCard result={paidResult} className={className} />;
    }

    return null;
  }

  if (message.name === "get_weather") {
    const weatherResult = parseToolMessageJson(message.content, weatherResponseSchema);

    if (weatherResult) {
      return <GetWeatherToolCard result={weatherResult} className={className} />;
    }

    return null;
  }

  return null;
}
