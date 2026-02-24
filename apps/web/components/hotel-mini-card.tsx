import type { DestinationHotelSummaryDTO } from "@trip-loom/api/dto";
import type { PriceRange } from "@trip-loom/api/enums";
import { amenityIcons } from "@/lib/amenity-icons";
import { WifiIcon } from "lucide-react";
import Image from "next/image";
import { Ratings } from "./ui/rating";
import { getCoverImage } from "@/lib/get-cover-image";

const PRICE_RANGE_LABELS: Record<PriceRange[number], string> = {
  budget: "$",
  moderate: "$$",
  upscale: "$$$",
  luxury: "$$$$",
};

type HotelMiniCardProps = {
  hotel: DestinationHotelSummaryDTO;
};

export function HotelMiniCard({ hotel }: HotelMiniCardProps) {
  return (
    <div className="group flex gap-3 rounded-xl bg-card p-2.5">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={getCoverImage(hotel.imagesUrls)}
          alt={hotel.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <p className="truncate text-sm font-medium leading-tight whitespace-normal">
            {hotel.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {hotel.rating && <Ratings rating={hotel.rating} />}
            {hotel.priceRange && (
              <span className="text-xs text-muted-foreground">
                {PRICE_RANGE_LABELS[hotel.priceRange]}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {hotel.amenities.slice(0, 3).map((amenity) => {
              const Icon = amenityIcons[amenity] ?? WifiIcon;
              return (
                <div
                  key={amenity}
                  className="flex size-5 items-center justify-center rounded bg-muted/60"
                  title={amenity.replace("-", " ")}
                >
                  <Icon className="size-3 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
