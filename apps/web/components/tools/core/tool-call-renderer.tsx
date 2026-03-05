import type { TripLoomToolCall } from "@trip-loom/agents";
import { ItineraryToolCard } from "@/components/tools/itinerary-tool-card";
import { SuggestDestinationsToolCard } from "@/components/tools/suggest-destinations-tool-card";
import { SuggestHotelBookingToolCard } from "@/components/tools/suggest-hotel-booking-tool-card";
import { UserPreferencesToolCard } from "@/components/tools/user-preferences-tool-card";
import { ToolCallJsonFallback } from "./tool-call-json-fallback";

export function ToolCallRenderer({ toolCall }: { toolCall: TripLoomToolCall }) {
  switch (toolCall.name) {
    case "get_user_preferences":
      return <UserPreferencesToolCard />;
    case "suggest_itinerary":
      return <ItineraryToolCard args={toolCall.args} />;
    case "suggest_destinations":
      return <SuggestDestinationsToolCard args={toolCall.args} />;
    case "suggest_hotel_booking":
      return <SuggestHotelBookingToolCard args={toolCall.args} />;
    default:
      return <ToolCallJsonFallback toolCall={toolCall} />;
  }
}
