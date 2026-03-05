"use client";

import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  SuggestHotelBookingArgs,
  suggestHotelBookingArgsSchema,
} from "./schema";
import { SuggestedHotelCard } from "./suggested-hotel-card";

function parseSuggestHotelBookingArgs(
  args: Record<string, unknown>,
): SuggestHotelBookingArgs | null {
  const result = suggestHotelBookingArgsSchema.safeParse(args);
  return result.success ? result.data : null;
}

type SuggestHotelBookingToolCardProps = {
  args: Record<string, unknown>;
};

export function SuggestHotelBookingToolCard({
  args,
}: SuggestHotelBookingToolCardProps) {
  const parsed = parseSuggestHotelBookingArgs(args);

  if (!parsed) {
    return null;
  }

  const hotels = parsed.hotels;

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <div className="space-y-1">
          <ToolCallCard.Title>Curated hotel options ready</ToolCallCard.Title>
          <ToolCallCard.Description>
            {`Compared ${hotels.length} stays so you can pick the one that fits your trip best`}
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{hotels.length} options</Badge>
        </div>

        <TooltipProvider delayDuration={100}>
          <Carousel opts={{ align: "start" }} className="px-2">
            <CarouselContent className="-ml-4">
              {hotels.map((hotel) => (
                <CarouselItem
                  key={hotel.id}
                  className="basis-[92%] pl-4 sm:basis-[72%] md:basis-[56%] xl:basis-[48%]"
                >
                  <SuggestedHotelCard hotel={hotel} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {hotels.length > 1 && (
              <>
                <CarouselPrevious className="-left-1 top-1/2 -translate-y-1/2" />
                <CarouselNext className="-right-1 top-1/2 -translate-y-1/2" />
              </>
            )}
          </Carousel>
        </TooltipProvider>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
