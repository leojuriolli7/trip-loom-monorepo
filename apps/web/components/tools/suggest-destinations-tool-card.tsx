"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { DestinationCard } from "@/components/destination-card";
import { destinationDetailDialogAtom } from "@/components/destination-detail-dialog";
import { useSetAtom } from "jotai";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

type SuggestDestinationsArgs = TripLoomToolArgsByName<"suggest_destinations">;

type SuggestDestinationsToolCardProps = {
  args: SuggestDestinationsArgs;
};

export function SuggestDestinationsToolCard({
  args,
}: SuggestDestinationsToolCardProps) {
  const destinations = args.destinations;

  const setDestinationDetailDialogAtom = useSetAtom(
    destinationDetailDialogAtom,
  );

  const handleDestinationClick = (destinationId: string) => {
    setDestinationDetailDialogAtom({ destinationId, isOpen: true });
  };

  return (
    <>
      <ToolCallCard size="lg">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/colliseum.png" alt="Rome Colliseum" />

          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>Destination picks are ready</ToolCallCard.Title>
            <ToolCallCard.Description>
              {`Picked ${destinations.length} options`}
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>

        <ToolCallCard.Content className="space-y-4">
          <Carousel
            opts={{ align: "start", loop: false }}
            className="w-full px-2"
          >
            <CarouselContent className="-ml-4 pb-1">
              {destinations.map((destination) => (
                <CarouselItem
                  key={destination.id}
                  className="basis-full pl-4 sm:basis-1/2 md:basis-1/3"
                >
                  <DestinationCard
                    destination={{
                      id: destination.id,
                      name: destination.name,
                      country: destination.country,
                      description: destination.description,
                      imageUrl: destination.imageUrl,
                    }}
                    onClick={() => handleDestinationClick(destination.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </ToolCallCard.Content>
      </ToolCallCard>
    </>
  );
}
