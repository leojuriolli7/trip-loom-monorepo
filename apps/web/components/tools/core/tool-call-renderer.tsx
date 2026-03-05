import type { TripLoomToolCall } from "@trip-loom/agents";
import { ItineraryToolCard } from "@/components/tools/itinerary-tool-card";
import { SuggestDestinationsToolCard } from "@/components/tools/suggest-destinations-tool-card";
import { SuggestHotelBookingToolCard } from "@/components/tools/suggest-hotel-booking-tool-card";
import { UserPreferencesToolCard } from "@/components/tools/user-preferences-tool-card";
import { ToolCallJsonFallback } from "./tool-call-json-fallback";
import { SearchDestinationsToolCard } from "../search-destinations-card";
import { UpdateTripToolCallCard } from "../update-trip-tool-card";
import { GetDestinationDetailsToolCard } from "../get-destination-details-tool-card";

export function ToolCallRenderer({ toolCall }: { toolCall: TripLoomToolCall }) {
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
    default:
      return <ToolCallJsonFallback toolCall={toolCall} />;
  }
}
