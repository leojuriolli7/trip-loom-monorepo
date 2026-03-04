"use client";

import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { tripQueries } from "@/lib/api/react-query/trips";
import { usePathname } from "next/navigation";

function getChatId(pathname: string): string | null {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  return pathname.split("/")[2] ?? null;
}

function getTripTitle(trip: TripWithDestinationDTO): string {
  if (trip.title) {
    return trip.title;
  }

  if (trip.destination?.name && trip.destination?.country) {
    return `${trip.destination.name}, ${trip.destination.country}`;
  }

  if (trip.destination?.name) {
    return trip.destination.name;
  }

  return "Untitled Trip";
}

function formatTripDates(trip: TripWithDestinationDTO): string {
  if (!trip.startDate || !trip.endDate) {
    return "Dates pending";
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}

export function ChatTopbar() {
  const pathname = usePathname();
  const chatId = getChatId(pathname);

  const { data: tripResult, isLoading } = useQuery({
    ...tripQueries.getTripById(chatId ?? ""),
    enabled: Boolean(chatId),
  });

  const trip = tripResult?.data ?? null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />

        {chatId ? (
          <div className="flex min-w-0 items-center gap-2">
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div>
                <p className="truncate font-medium">
                  {trip ? getTripTitle(trip) : "Trip conversation"}
                </p>
                <p className="truncate text-sm leading-none text-muted-foreground">
                  {trip ? formatTripDates(trip) : "Trip details unavailable"}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
