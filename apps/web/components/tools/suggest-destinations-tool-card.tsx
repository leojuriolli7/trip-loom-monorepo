"use client";

import { destinationSchema } from "@trip-loom/api/dto";
import { useState } from "react";
import Image from "next/image";
import { DestinationCard } from "@/components/destination-card";
import { DestinationDetailDialog } from "@/components/destination-detail-dialog";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { z } from "zod";

const suggestDestinationsArgsSchema = z.object({
  destinations: z
    .array(
      destinationSchema
        .pick({
          id: true,
          name: true,
          country: true,
        })
        .extend({
          imageUrl: z.string().nullable(),
          description: destinationSchema.shape.description.optional(),
        }),
    )
    .min(1),
});

type SuggestDestinationsArgs = z.infer<typeof suggestDestinationsArgsSchema>;

type SuggestDestinationsToolCardProps = {
  args: Record<string, unknown>;
};

function parseSuggestDestinationsArgs(
  args: Record<string, unknown>,
): SuggestDestinationsArgs | null {
  const result = suggestDestinationsArgsSchema.safeParse(args);
  return result.success ? result.data : null;
}

export function SuggestDestinationsToolCard({
  args,
}: SuggestDestinationsToolCardProps) {
  const parsed = parseSuggestDestinationsArgs(args);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  if (!parsed) {
    return null;
  }

  const destinations = parsed.destinations;

  const handleDestinationClick = (destinationId: string) => {
    setSelectedDestinationId(destinationId);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setSelectedDestinationId(null);
    }
  };

  return (
    <>
      <ToolCallCard>
        <ToolCallCard.Header>
          <div className="relative size-16 shrink-0 rounded-2xl border border-border/60 bg-background/75 p-2">
            <Image
              src="/colliseum.png"
              alt=""
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>

          <div className="space-y-1">
            <ToolCallCard.Title>Destination picks are ready</ToolCallCard.Title>
            <ToolCallCard.Description>
              {`Picked ${destinations.length} options to compare visually`}
            </ToolCallCard.Description>
          </div>
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
            {destinations.length > 3 && (
              <>
                <CarouselPrevious className="-left-2 lg:-left-10" />
                <CarouselNext className="-right-2 lg:-right-10" />
              </>
            )}
          </Carousel>
        </ToolCallCard.Content>
      </ToolCallCard>

      <DestinationDetailDialog
        destinationId={selectedDestinationId}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  );
}
