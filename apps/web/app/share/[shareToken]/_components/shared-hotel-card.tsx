import Image from "next/image";
import { CalendarIcon, BedDoubleIcon, StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SharedHotelBookingDTO } from "@trip-loom/contracts/dto";
import { format } from "date-fns";
import { parseIsoDate } from "@/lib/parse-iso-date";

type SharedHotelCardProps = {
  booking: SharedHotelBookingDTO;
};

export function SharedHotelCard({ booking }: SharedHotelCardProps) {
  const coverImage = booking.hotel.imagesUrls?.find((img) => img.isCover);
  const checkIn = format(parseIsoDate(booking.checkInDate), "MMM d");
  const checkOut = format(parseIsoDate(booking.checkOutDate), "MMM d, yyyy");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card transition-colors hover:bg-accent/30">
      <div className="flex flex-col sm:flex-row">
        {coverImage && (
          <div className="relative h-36 w-full sm:h-auto sm:w-40 shrink-0">
            <Image
              src={coverImage.url}
              alt={booking.hotel.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{booking.hotel.name}</p>
              {booking.hotel.rating && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                  {booking.hotel.rating.toFixed(1)}
                </div>
              )}
            </div>

            <Badge
              variant={booking.status === "confirmed" ? "default" : "secondary"}
              className="text-xs capitalize shrink-0"
            >
              {booking.status}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {checkIn} - {checkOut}
            </span>
            <span className="flex items-center gap-1.5">
              <BedDoubleIcon className="size-3.5" />
              {booking.numberOfNights} {booking.numberOfNights === 1 ? "night" : "nights"} &middot;{" "}
              <span className="capitalize">{booking.roomType.replace("-", " ")}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
