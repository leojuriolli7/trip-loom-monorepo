"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TripCard, type Trip } from "./trip-card";
import Image from "next/image";
import Link from "next/link";

interface TripsCarouselProps {
  title: string;
  trips: Trip[];
  emptyMessage?: string;
  emptyMessageIcon?: string;
}

export function TripsCarousel({
  title,
  trips,
  emptyMessage = "No trips yet",
  emptyMessageIcon = "/colliseum.png",
}: TripsCarouselProps) {
  if (!trips?.length) {
    return (
      <section className="mx-auto max-w-5xl px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-semibold text-foreground">{title}</h2>
        <div className="flex flex-col h-48 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30">
          <Image
            src={emptyMessageIcon}
            alt=""
            width={112}
            height={112}
            className="w-28 h-28"
          />

          <p className="text-muted-foreground text-center">
            {emptyMessage}
            <br />
            <Link href="/chat" className="underline text-sm text-primary">
              Get started!
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <h2 className="mb-6 text-xl font-semibold text-foreground">{title}</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 pb-1">
          {trips.map((trip) => (
            <CarouselItem
              key={trip.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <TripCard trip={trip} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {trips.length > 3 && (
          <>
            <CarouselPrevious className="-left-4 lg:-left-12" />
            <CarouselNext className="-right-4 lg:-right-12" />
          </>
        )}
      </Carousel>
    </section>
  );
}
