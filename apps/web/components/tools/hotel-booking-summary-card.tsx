import type { ReactNode } from "react";
import { format } from "date-fns";
import type { HotelBookingDTO } from "@trip-loom/contracts/dto";
import { MapPinIcon } from "lucide-react";
import { StreamingImage } from "@/components/streaming-image";
import { Badge } from "@/components/ui/badge";
import { Ratings } from "@/components/ui/rating";
import { parseIsoDate } from "@/lib/parse-iso-date";
import { formatPaymentAmount } from "@/utils/payments";
import { ToolCallCard } from "./tool-call-card";

type HotelBookingSummaryCardProps = {
  booking: HotelBookingDTO;
  title: string;
  summary: string;
  statusLabel: string;
  footer?: ReactNode;
  children?: ReactNode;
};

/**
 * Room types come from API enums, so this keeps the UI label readable without
 * leaking enum formatting into call sites.
 */
function formatRoomTypeLabel(roomType: HotelBookingDTO["roomType"]) {
  return roomType
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Booking dates are stored as ISO dates; this formats them for the hotel review
 * card without introducing time-zone-specific times.
 */
function formatBookingDate(date: string) {
  return format(parseIsoDate(date), "MMM d, yyyy");
}

function getHotelImageUrl(booking: HotelBookingDTO) {
  return booking.hotel.imagesUrls?.[0]?.url || "/placeholder.png";
}

/**
 * Renders the authoritative hotel booking details returned by the API.
 * This compact layout is reused both for persisted pending-booking history and
 * for the live payment interrupt so the user sees one consistent summary.
 */
export function HotelBookingSummaryCard({
  booking,
  title,
  summary,
  statusLabel,
  footer,
  children,
}: HotelBookingSummaryCardProps) {
  const hotelRating = booking.hotel.rating;
  const hotelImageUrl = getHotelImageUrl(booking);

  return (
    <ToolCallCard className="border-border/60 bg-card shadow-none">
      <ToolCallCard.Header className="gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-secondary/30">
          <StreamingImage
            src={hotelImageUrl}
            alt={booking.hotel.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <ToolCallCard.HeaderContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50">
              {statusLabel}
            </Badge>
            <Badge variant="outline">
              {formatRoomTypeLabel(booking.roomType)}
            </Badge>
            <Badge variant="outline">
              {booking.numberOfNights} night
              {booking.numberOfNights === 1 ? "" : "s"}
            </Badge>
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
                {booking.hotel.name}
              </h4>

              {typeof hotelRating === "number" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ratings rating={hotelRating} />
                  <span>{hotelRating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            <div className="inline-flex items-start gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              <span className="line-clamp-2">{booking.hotel.address}</span>
            </div>
          </div>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Check-in
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatBookingDate(booking.checkInDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Check-out
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatBookingDate(booking.checkOutDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Price per night
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatPaymentAmount(booking.pricePerNightInCents, "usd")}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatPaymentAmount(booking.totalPriceInCents, "usd")}
            </p>
          </div>
        </div>

        {children}
      </ToolCallCard.Content>

      {footer ? <ToolCallCard.Footer>{footer}</ToolCallCard.Footer> : null}
    </ToolCallCard>
  );
}
