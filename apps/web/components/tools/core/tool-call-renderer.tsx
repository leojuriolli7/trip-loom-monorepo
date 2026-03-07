import type { TripLoomToolCall } from "@trip-loom/agents";
import { ItineraryMutationToolCard } from "@/components/tools/itinerary-mutation-tool-card";
import { SuggestedItineraryToolCard } from "@/components/tools/suggested-itinerary-tool-card";
import { SuggestDestinationsToolCard } from "@/components/tools/suggest-destinations-tool-card";
import { SuggestFlightToolCard } from "@/components/tools/suggest-flight-tool-card";
import { SuggestHotelBookingToolCard } from "@/components/tools/suggest-hotel-booking-tool-card";
import { UserPreferencesToolCard } from "@/components/tools/user-preferences-tool-card";
import { ToolCallJsonFallback } from "./tool-call-json-fallback";
import { SearchDestinationsToolCard } from "../search-destinations-card";
import { UpdateTripToolCallCard } from "../update-trip-tool-card";
import { GetDestinationDetailsToolCard } from "../get-destination-details-tool-card";
import { SearchFlightsToolCard } from "../search-flights-card";
import { SearchHotelsToolCard } from "../search-hotels-card";
import { GetTripDetailsToolCard } from "../get-trip-details-tool-card/get-trip-details-tool-card";
import { TransferAgentToolCard } from "../transfer-agent-tool-card";

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
  "book_flight",
  "create_hotel_booking",
  "request_cancellation",
  "request_payment",
  "request_seat_selection",
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
    case "get_trip_details":
      return <GetTripDetailsToolCard args={toolCall.args} />;
    case "get_user_preferences":
      return <UserPreferencesToolCard args={toolCall.args} />;
    case "suggest_itinerary":
      return (
        <SuggestedItineraryToolCard
          args={toolCall.args}
          toolCallId={toolCall.id}
        />
      );
    case "create_itinerary":
    case "add_itinerary_day":
    case "add_itinerary_activity":
    case "update_itinerary_activity":
    case "delete_itinerary_activity":
      return <ItineraryMutationToolCard toolCall={toolCall} />;
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
    case "suggest_flight":
      return <SuggestFlightToolCard args={toolCall.args} />;
    case "search_flights":
      return <SearchFlightsToolCard args={toolCall.args} />;
    case "search_hotels":
      return <SearchHotelsToolCard args={toolCall.args} />;
    case "transfer_to_destination_agent":
    case "transfer_to_flight_agent":
    case "transfer_to_hotel_agent":
    case "transfer_to_itinerary_agent":
    case "transfer_back_to_supervisor":
      return <TransferAgentToolCard toolName={toolCall.name} />;
    default:
      return <ToolCallJsonFallback toolCall={toolCall} />;
  }
}
