"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DestinationCard, type Destination } from "./destination-card";

interface DestinationsSectionProps {
  title: string;
  subtitle?: string;
  destinations: Destination[];
}

export function DestinationsSection({
  title,
  subtitle,
  destinations,
}: DestinationsSectionProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 pb-1">
          {destinations.map((destination) => (
            <CarouselItem
              key={destination.id}
              className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <DestinationCard destination={destination} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {destinations.length > 4 && (
          <>
            <CarouselPrevious className="-left-4 lg:-left-12" />
            <CarouselNext className="-right-4 lg:-right-12" />
          </>
        )}
      </Carousel>
    </section>
  );
}
