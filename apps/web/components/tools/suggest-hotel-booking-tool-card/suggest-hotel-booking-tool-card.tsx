"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SuggestedHotelCard } from "./suggested-hotel-card";

type SuggestHotelBookingToolCardProps = {
  args: TripLoomToolArgsByName<"suggest_hotel_booking">;
};

export function SuggestHotelBookingToolCard({
  args,
}: SuggestHotelBookingToolCardProps) {
  const hotels = args.hotels;

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.HeaderContent className="space-y-1 pt-0">
          <ToolCallCard.Title>Curated hotel options ready</ToolCallCard.Title>

          <ToolCallCard.Description>
            {`Compared ${hotels?.length} stays so you can pick the one that fits your trip best`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="space-y-4">
        <TooltipProvider delayDuration={100}>
          <Carousel opts={{ align: "start" }} className="px-2">
            <CarouselContent className="-ml-4">
              {hotels?.map((hotel, index) => (
                <CarouselItem
                  key={hotel?.id || index}
                  className="basis-[92%] pl-4 sm:basis-[72%] md:basis-[56%] xl:basis-[48%]"
                >
                  <SuggestedHotelCard hotel={hotel} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </TooltipProvider>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
