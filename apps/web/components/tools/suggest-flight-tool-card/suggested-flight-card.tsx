"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ClockIcon, PlaneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";

type SuggestedFlight =
  TripLoomToolArgsByName<"suggest_flight">["flights"][number];

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency?.toUpperCase()} ${price}`;
  }
}

function formatTime(isoString: string) {
  try {
    const toDate = new Date(isoString);

    if (!isValid(toDate)) return "";

    return format(new Date(isoString), "HH:mm");
  } catch {
    return "";
  }
}

function formatDuration(departure: string, arrival: string) {
  try {
    const diffMs = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  } catch {
    return "";
  }
}

function getStopsLabel(stops: number) {
  if (!stops) return "Direct";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

export function SuggestedFlightCard({ flight }: { flight: SuggestedFlight }) {
  const duration = formatDuration(flight?.departureTime, flight?.arrivalTime);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            {flight?.airline}
          </h4>

          <Badge
            variant={flight?.stops === 0 ? "default" : "outline"}
            className="text-xs"
          >
            {getStopsLabel(flight?.stops)}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">
              {formatTime(flight?.departureTime)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {flight?.origin}
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center px-2">
            <div className="flex w-full items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <PlaneIcon className="size-4 text-primary" />
              <div className="h-px flex-1 bg-border" />
            </div>
            {duration && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <ClockIcon className="size-3" />
                {duration}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">
              {formatTime(flight?.arrivalTime)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {flight?.destination}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          {!!flight?.price && !!flight?.currency && (
            <p className="text-sm font-semibold text-foreground">
              {formatPrice(flight?.price, flight?.currency)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
