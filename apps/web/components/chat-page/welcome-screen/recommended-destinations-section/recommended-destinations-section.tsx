"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DestinationCard } from "@/components/destination-card";
import { destinationDetailDialogAtom } from "@/components/destination-detail-dialog";
import { useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { destinationQueries } from "@/lib/api/react-query/destinations";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

interface DestinationsSectionProps {
  limit?: number;
}

export function RecommendedDestinationsSection({
  limit = 10,
}: DestinationsSectionProps) {
  const setDestinationDetailDialogAtom = useSetAtom(
    destinationDetailDialogAtom,
  );

  const { data: destinations = [], status } = useQuery(
    destinationQueries.listRecommendedDestinations(limit),
  );

  const handleDestinationClick = (destinationId: string) => {
    setDestinationDetailDialogAtom({ destinationId, isOpen: true });
  };

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Recommended for you
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your preferences and travel history
        </p>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        {status !== "success" && (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30">
            {status === "error" && (
              <p className="text-sm text-destructive">
                Could not load recommendations
              </p>
            )}

            {status === "pending" && <Spinner className="size-8" />}
          </div>
        )}

        {status === "success" && !destinations.length && (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30">
            <Image
              src="/palm-tree.png"
              alt=""
              width={112}
              height={112}
              className="h-28 w-28"
            />

            <p className="text-center text-muted-foreground">
              Set your travel preferences to get personalized recommendations
            </p>
          </div>
        )}

        {status === "success" && destinations.length > 0 && (
          <>
            <CarouselContent className="-ml-4 pb-1">
              {destinations.map((destination) => (
                <CarouselItem
                  key={destination.id}
                  className="basis-full pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <DestinationCard
                    destination={destination}
                    onClick={() => handleDestinationClick(destination.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {destinations.length > 4 && (
              <>
                <CarouselPrevious className="-left-4 lg:-left-12" />
                <CarouselNext className="-right-4 lg:-right-12" />
              </>
            )}
          </>
        )}
      </Carousel>
    </section>
  );
}
