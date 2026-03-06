import type { TripLoomToolCall } from "@trip-loom/agents";
import { ItineraryToolCard } from "@/components/tools/itinerary-tool-card";
import { SuggestDestinationsToolCard } from "@/components/tools/suggest-destinations-tool-card";
import { SuggestHotelBookingToolCard } from "@/components/tools/suggest-hotel-booking-tool-card";
import { UserPreferencesToolCard } from "@/components/tools/user-preferences-tool-card";
import { ToolCallJsonFallback } from "./tool-call-json-fallback";
import { SearchDestinationsToolCard } from "../search-destinations-card";
import { UpdateTripToolCallCard } from "../update-trip-tool-card";
import { GetDestinationDetailsToolCard } from "../get-destination-details-tool-card";
import { SearchHotelsToolCard } from "../search-hotels-card";

/**
 * These tool calls can appear on assistant messages, but their UI belongs to a
 * different rendering layer:
 * - live approval/payment prompts come from `stream.interrupts`
 * - persisted hotel booking/payment outcomes come from `tool` messages
 *
 * Excluding them here keeps the assistant-message layer focused on previewable
 * tool calls that can be rendered directly from their args.
 */
const NON_RENDERABLE_ASSISTANT_TOOL_CALL_NAMES = new Set([
  "create_hotel_booking",
  "request_cancellation",
  "request_payment",
]);

/**
 * Assistant `tool_calls` and persisted `tool` messages are distinct message
 * shapes in the chat history. This helper only answers whether a tool call
 * should render inside the assistant-message layer.
 */
export function isRenderableAssistantToolCall(toolCall: TripLoomToolCall) {
  return !NON_RENDERABLE_ASSISTANT_TOOL_CALL_NAMES.has(toolCall.name);
}

/**
 * Renders cards for assistant `tool_calls`, which are lightweight previews of
 * tool activity attached to an assistant message.
 */
export function ToolCallRenderer({ toolCall }: { toolCall: TripLoomToolCall }) {
  if (!isRenderableAssistantToolCall(toolCall)) {
    return null;
  }

  switch (toolCall.name) {
    case "get_user_preferences":
      return <UserPreferencesToolCard args={toolCall.args} />;
    case "suggest_itinerary":
      return <ItineraryToolCard args={toolCall.args} />;
    case "suggest_destinations":
      return <SuggestDestinationsToolCard args={toolCall.args} />;
    case "suggest_hotel_booking":
      return <SuggestHotelBookingToolCard args={toolCall.args} />;
    case "search_destinations":
      return <SearchDestinationsToolCard args={toolCall.args} />;
    case "get_destination_details":
      return <GetDestinationDetailsToolCard args={toolCall.args} />;
    case "update_trip":
      return <UpdateTripToolCallCard args={toolCall.args} />;
    case "search_hotels":
      return <SearchHotelsToolCard args={toolCall.args} />;
    default:
      return <ToolCallJsonFallback toolCall={toolCall} />;
  }
}
