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
import { Button } from "../ui/button";
import { ArrowRightIcon } from "lucide-react";

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

  if (destinations?.length === 1) {
    const destination = destinations[0];
    return (
      <ToolCallCard size="lg">
        <ToolCallCard.Header>
          <ToolCallCard.Image
            className="object-cover rounded-2xl"
            src={destination?.imageUrl || "/placeholder.png"}
            alt="Destination image"
          />

          <div className="flex justify-between w-full items-end">
            <ToolCallCard.HeaderContent className="space-y-0">
              <ToolCallCard.Title>
                Tailored suggestion: {destination?.name}
              </ToolCallCard.Title>
              <ToolCallCard.Description>
                Based on our talk, this is my suggestion
              </ToolCallCard.Description>
            </ToolCallCard.HeaderContent>

            <Button
              onClick={() => {
                setDestinationDetailDialogAtom({
                  isOpen: true,
                  destinationId: destination?.id,
                });
              }}
              size="sm"
              className="w-32"
            >
              See more
              <ArrowRightIcon />
            </Button>
          </div>
        </ToolCallCard.Header>
      </ToolCallCard>
    );
  }

  return (
    <>
      <ToolCallCard size="lg">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/colliseum.png" alt="Rome Colliseum" />

          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>Destination picks are ready</ToolCallCard.Title>
            <ToolCallCard.Description>
              {`Picked ${destinations?.length} options`}
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>

        <ToolCallCard.Content className="space-y-4">
          <Carousel
            opts={{ align: "start", loop: false }}
            className="w-full px-2"
          >
            <CarouselContent className="-ml-4 pb-1">
              {destinations?.map((destination, idx) => (
                <CarouselItem
                  key={destination?.id || idx}
                  className="basis-full pl-4 sm:basis-1/2 md:basis-1/3"
                >
                  <DestinationCard
                    destination={destination}
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
