import type { ReactNode } from "react";
import { format } from "date-fns";
import type { FlightBookingDetailDTO } from "@trip-loom/contracts/dto";
import { PlaneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPaymentAmount } from "@/lib/payments";
import { ToolCallCard } from "./tool-call-card";

type FlightBookingSummaryCardProps = {
  booking: FlightBookingDetailDTO;
  title: string;
  summary: string;
  statusLabel: string;
  footer?: ReactNode;
  children?: ReactNode;
};

const CABIN_CLASS_LABELS: Record<FlightBookingDetailDTO["cabinClass"], string> =
  {
    economy: "Economy",
    business: "Business",
    first: "First Class",
  };

function formatFlightTime(date: Date) {
  return format(date, "HH:mm");
}

function formatFlightDate(date: Date) {
  return format(date, "MMM d, yyyy");
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function FlightBookingSummaryCard({
  booking,
  title,
  summary,
  statusLabel,
  footer,
  children,
}: FlightBookingSummaryCardProps) {
  return (
    <ToolCallCard className="border-none bg-card shadow-none">
      <ToolCallCard.Header className="gap-4">
        <ToolCallCard.HeaderContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50">
              {statusLabel}
            </Badge>
            <Badge variant="outline">
              {CABIN_CLASS_LABELS[booking.cabinClass]}
            </Badge>
            {booking.seatNumber && (
              <Badge variant="outline">Seat {booking.seatNumber}</Badge>
            )}
          </div>

          <div className="space-y-1">
            <ToolCallCard.Title>{title}</ToolCallCard.Title>
            <ToolCallCard.Description className="first-letter:normal">
              {summary}
            </ToolCallCard.Description>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                {booking.airline} {booking.flightNumber}
              </h4>
            </div>
          </div>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="space-y-3">
        <div className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">
                {formatFlightTime(booking.departureTime)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {booking.departureAirportCode}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {booking.departureCity}
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center px-3">
              <div className="flex w-full items-center gap-1">
                <div className="h-px flex-1 bg-border" />
                <PlaneIcon className="size-4 text-primary" />
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {formatDuration(booking.durationMinutes)}
              </p>
            </div>

            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">
                {formatFlightTime(booking.arrivalTime)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {booking.arrivalAirportCode}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {booking.arrivalCity}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Departure
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatFlightDate(booking.departureTime)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Arrival
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatFlightDate(booking.arrivalTime)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatPaymentAmount(booking.priceInCents, "usd")}
            </p>
          </div>

          {booking.seatNumber && (
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Seat
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {booking.seatNumber}
              </p>
            </div>
          )}
        </div>

        {children}
      </ToolCallCard.Content>

      {footer ? <ToolCallCard.Footer>{footer}</ToolCallCard.Footer> : null}
    </ToolCallCard>
  );
}
