import type { TripLoomToolCall } from "@trip-loom/agents";
import { ItineraryToolCard } from "@/components/tools/itinerary-tool-card";
import { SuggestHotelBookingToolCard } from "@/components/tools/suggest-hotel-booking-tool-card";
import { UserPreferencesToolCard } from "@/components/tools/user-preferences-tool-card";
import { ToolCallJsonFallback } from "./tool-call-json-fallback";
import { Suspense } from "react";

export function ToolCallRenderer({ toolCall }: { toolCall: TripLoomToolCall }) {
  switch (toolCall.name) {
    case "get_user_preferences":
      return <UserPreferencesToolCard />;
    case "suggest_itinerary":
      return (
        <Suspense fallback={<ToolCallJsonFallback toolCall={toolCall} />}>
          <ItineraryToolCard args={toolCall.args} />
        </Suspense>
      );
    case "suggest_hotel_booking":
      return (
        <Suspense fallback={<ToolCallJsonFallback toolCall={toolCall} />}>
          <SuggestHotelBookingToolCard args={toolCall.args} />
        </Suspense>
      );
    default:
      return <ToolCallJsonFallback toolCall={toolCall} />;
  }
}
