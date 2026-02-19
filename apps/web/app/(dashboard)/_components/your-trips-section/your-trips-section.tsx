"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TripCard } from "./trip-card";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { tripQueries } from "@/lib/api/react-query/trips";
import { Spinner } from "@/components/ui/spinner";
import { useMemo } from "react";
import { TripStatus } from "@trip-loom/api/enums";

export function YourTripsSection() {
  const { data: trips = [], status: queryStatus } = useInfiniteQuery(
    tripQueries.listTrips({
      status: ["upcoming", "draft", "past"],
      limit: 10,
    }),
  );

  const orderedTrips = useMemo(() => {
    const statusOrder: Record<TripStatus, number> = {
      current: 0,
      upcoming: 1,
      draft: 2,
      past: 3,
      cancelled: 4,
    };

    return [...trips].sort((a, b) => {
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    });
  }, [trips]);

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <h2 className="mb-6 text-xl font-semibold text-foreground">Your trips</h2>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        {/*
          Error and pending statuses: Render error message or loading spinner.
        */}
        {queryStatus !== "success" && (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30">
            {queryStatus === "error" && (
              <p className="text-sm text-destructive">
                Could not load trips right now.
              </p>
            )}

            {queryStatus === "pending" && <Spinner className="size-8" />}
          </div>
        )}

        {queryStatus === "success" && !trips.length && (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30">
            <Image
              src={"/colliseum.png"}
              alt=""
              width={112}
              height={112}
              className="w-28 h-28"
            />

            <p className="text-muted-foreground text-center">
              No trips yet
              <br />
              <Link href="/chat" className="text-sm text-primary underline">
                Get started!
              </Link>
            </p>
          </div>
        )}

        {queryStatus === "success" && trips.length > 0 && (
          <>
            <CarouselContent className="-ml-4 pb-1">
              {orderedTrips.map((trip) => (
                <CarouselItem
                  key={trip.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Link href={`/chat/${trip.id}`}>
                    <TripCard trip={trip} />
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            {trips.length > 3 && (
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
