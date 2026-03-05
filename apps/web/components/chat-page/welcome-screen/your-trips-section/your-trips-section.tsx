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
import { TripStatus } from "@trip-loom/contracts/enums";
import { PersonalizeCtaCard } from "./personalize-cta-card";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

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

    return trips
      .filter((t) => {
        const hasDates = t.startDate && t.endDate;

        if (!t.title && !hasDates && !t.destinationId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      });
  }, [trips]);

  const isDesktop = useMediaQuery("(min-width: 640px)");

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Your trips
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ongoing plans and upcoming adventures, all in one place.
          </p>
        </div>
      </div>

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
          <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-border/70 bg-linear-to-br from-muted/40 via-card to-transparent">
            {queryStatus === "error" && (
              <p className="text-sm text-destructive">
                Could not load trips right now.
              </p>
            )}

            {queryStatus === "pending" && <Spinner className="size-8" />}
          </div>
        )}

        {queryStatus === "success" && !trips.length && (
          <div className="relative flex h-48 flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-linear-to-br from-primary/8 via-card to-chart-2/10">
            <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/14 blur-2xl" />
            <Image
              src={"/colliseum.png"}
              alt=""
              width={112}
              height={112}
              className="h-28 w-28"
            />

            <p className="relative text-center text-muted-foreground">
              You have not planned any trips yet
              <br />
              <Link href="/chat" className="text-sm text-primary underline">
                Get started!
              </Link>
            </p>
          </div>
        )}

        {queryStatus === "success" && trips.length > 0 && (
          <>
            <CarouselContent className="-ml-4 pb-7 pt-1">
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

              {trips.length < 3 && isDesktop === true && (
                <CarouselItem
                  className={cn(
                    "pl-4 basis-full",
                    trips.length === 1
                      ? "lg:basis-[66%] sm:basis-1/2"
                      : "basis-1/3",
                  )}
                >
                  <PersonalizeCtaCard />
                </CarouselItem>
              )}
            </CarouselContent>

            {trips.length > 3 && (
              <>
                <CarouselPrevious className="-left-4 border-border/70 bg-background/90 shadow-[0_14px_22px_-18px_rgba(15,23,42,0.75)] lg:-left-12" />
                <CarouselNext className="-right-4 border-border/70 bg-background/90 shadow-[0_14px_22px_-18px_rgba(15,23,42,0.75)] lg:-right-12" />
              </>
            )}
          </>
        )}
      </Carousel>
    </section>
  );
}
