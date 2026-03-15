import { PlaneIcon, ClockIcon, ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SharedFlightBookingDTO } from "@trip-loom/contracts/dto";
import { format } from "date-fns";

type SharedFlightCardProps = {
  flight: SharedFlightBookingDTO;
};

function formatFlightTime(isoString: string): string {
  return format(new Date(isoString), "HH:mm");
}

function formatFlightDate(isoString: string): string {
  return format(new Date(isoString), "MMM d, yyyy");
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function SharedFlightCard({ flight }: SharedFlightCardProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <PlaneIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{flight.airline}</p>
            <p className="text-xs text-muted-foreground">
              {flight.flightNumber} &middot;{" "}
              <span className="capitalize">{flight.type}</span>
            </p>
          </div>
        </div>

        <Badge
          variant={flight.status === "confirmed" ? "default" : "secondary"}
          className="text-xs capitalize"
        >
          {flight.status}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="text-center">
          <p className="text-lg font-semibold tabular-nums">
            {formatFlightTime(flight.departureTime)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {flight.departureAirportCode}
          </p>
          <p className="text-xs text-muted-foreground">
            {flight.departureCity}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3" />
            {formatDuration(flight.durationMinutes)}
          </div>
          <div className="flex w-full items-center gap-1">
            <div className="h-px flex-1 bg-border" />
            <ArrowRightIcon className="size-3 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFlightDate(flight.departureTime)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold tabular-nums">
            {formatFlightTime(flight.arrivalTime)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {flight.arrivalAirportCode}
          </p>
          <p className="text-xs text-muted-foreground">
            {flight.arrivalCity}
          </p>
        </div>
      </div>
    </div>
  );
}
