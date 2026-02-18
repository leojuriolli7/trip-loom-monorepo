import Image from "next/image";
import {
  StarIcon,
  WifiIcon,
  CarIcon,
  UtensilsIcon,
  WavesIcon,
  DumbbellIcon,
  PawPrintIcon,
  GlassWaterIcon,
  BriefcaseIcon,
  ShirtIcon,
  AirVentIcon,
  MountainSnowIcon,
  BuildingIcon,
  ConciergeBellIcon,
  PlaneIcon,
} from "lucide-react";
import type { DestinationHotelSummaryDTO } from "@trip-loom/api/dto";
import type { amenityValues, priceRangeValues } from "@trip-loom/api/enums";

export const AMENITY_ICONS: Record<
  (typeof amenityValues)[number],
  React.ComponentType<{ className?: string }>
> = {
  wifi: WifiIcon,
  pool: WavesIcon,
  spa: GlassWaterIcon,
  gym: DumbbellIcon,
  restaurant: UtensilsIcon,
  bar: GlassWaterIcon,
  parking: CarIcon,
  "airport-shuttle": PlaneIcon,
  "room-service": ConciergeBellIcon,
  concierge: ConciergeBellIcon,
  "beach-access": WavesIcon,
  "pet-friendly": PawPrintIcon,
  "business-center": BriefcaseIcon,
  "kids-club": StarIcon,
  laundry: ShirtIcon,
  "air-conditioning": AirVentIcon,
  balcony: MountainSnowIcon,
  "ocean-view": WavesIcon,
  "city-view": BuildingIcon,
};

export const PRICE_RANGE_LABELS: Record<
  (typeof priceRangeValues)[number],
  string
> = {
  budget: "$",
  moderate: "$$",
  upscale: "$$$",
  luxury: "$$$$",
};

type HotelMiniCardProps = {
  hotel: DestinationHotelSummaryDTO;
};

export function HotelMiniCard({ hotel }: HotelMiniCardProps) {
  const pricePerNight = (hotel.avgPricePerNightInCents / 100).toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    },
  );

  return (
    <div className="group flex gap-3 rounded-xl border border-border/60 bg-card p-2.5 transition-colors hover:border-primary/30">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={hotel.imageUrl ?? "/placeholder.png"}
          alt={hotel.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <p className="truncate text-sm font-medium leading-tight">
            {hotel.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <StarIcon
                  key={i}
                  className="size-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {PRICE_RANGE_LABELS[hotel.priceRange]}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {hotel.amenities.slice(0, 3).map((amenity) => {
              const Icon = AMENITY_ICONS[amenity] ?? WifiIcon;
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
          <p className="text-xs font-medium text-primary">
            {pricePerNight}
            <span className="text-muted-foreground">/night</span>
          </p>
        </div>
      </div>
    </div>
  );
}
