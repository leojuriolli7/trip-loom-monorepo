import type { TripLoomToolCall } from "@trip-loom/agents";
import { ItineraryMutationToolCard } from "@/components/tools/itinerary-mutation-tool-card";
import { SuggestDestinationsToolCard } from "@/components/tools/suggest-destinations-tool-card";
import { SuggestFlightToolCard } from "@/components/tools/suggest-flight-tool-card";
import { SuggestHotelBookingToolCard } from "@/components/tools/suggest-hotel-booking-tool-card";
import { UserPreferencesToolCard } from "@/components/tools/user-preferences-tool-card";
import { SearchDestinationsToolCard } from "../search-destinations-card";
import { UpdateTripToolCallCard } from "../update-trip-tool-card";
import { GetDestinationDetailsToolCard } from "../get-destination-details-tool-card";
import { SearchFlightsToolCard } from "../search-flights-card";
import { SearchHotelsToolCard } from "../search-hotels-card";
import { GetTripDetailsToolCard } from "../get-trip-details-tool-card/get-trip-details-tool-card";
import { SuggestNewTripCard } from "../suggest-new-trip-card";
import { TransferAgentToolCard } from "../transfer-agent-tool-card";
import { GetRecommendedDestinationsCard } from "../get-recommended-destinations-card";
import { GetWeatherToolCallCard } from "../get-weather-tool-call-card";

/**
 * Whitelist of tool calls that have a visual card in the assistant-message layer.
 * A tool call is only rendered if its name appears here AND has a matching
 * case in the ToolCallRenderer switch below.
 *
 * When adding a new tool card:
 * 1. Add the switch case in ToolCallRenderer
 * 2. Add the tool name to this Set
 */
const RENDERABLE_TOOL_CALL_NAMES: ReadonlySet<string> = new Set([
  "get_trip_details",
  "get_user_preferences",
  "get_recommended_destinations",
  "create_itinerary",
  "add_itinerary_day",
  "add_itinerary_activity",
  "update_itinerary_activity",
  "delete_itinerary_activity",
  "suggest_destinations",
  "suggest_hotel_booking",
  "search_destinations",
  "get_destination_details",
  "update_trip",
  "suggest_flight",
  "search_flights",
  "get_weather",
  "search_hotels",
  "suggest_new_trip",
  "transfer_to_destination_agent",
  "transfer_to_flight_agent",
  "transfer_to_hotel_agent",
  "transfer_to_itinerary_agent",
  "transfer_back_to_supervisor",
]);

/**
 * Whether a tool call has a visual card in the assistant-message layer.
 */
export function isRenderableAssistantToolCall(toolCall: TripLoomToolCall) {
  return RENDERABLE_TOOL_CALL_NAMES.has(toolCall.name);
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
      return (
        <GetTripDetailsToolCard args={toolCall.args} toolCallId={toolCall.id} />
      );
    case "get_user_preferences":
      return <UserPreferencesToolCard args={toolCall.args} />;
    case "get_recommended_destinations":
      return <GetRecommendedDestinationsCard args={toolCall.args} />;
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
      return (
        <SuggestFlightToolCard args={toolCall.args} toolCallId={toolCall.id} />
      );
    case "search_flights":
      return <SearchFlightsToolCard args={toolCall.args} />;
    case "get_weather":
      return <GetWeatherToolCallCard args={toolCall.args} />;
    case "search_hotels":
      return <SearchHotelsToolCard args={toolCall.args} />;
    case "suggest_new_trip":
      return <SuggestNewTripCard args={toolCall.args} />;
    case "transfer_to_destination_agent":
    case "transfer_to_flight_agent":
    case "transfer_to_hotel_agent":
    case "transfer_to_itinerary_agent":
    case "transfer_back_to_supervisor":
      return <TransferAgentToolCard toolName={toolCall.name} />;
    default:
      return null;
  }
}
