import { Badge } from "@/components/ui/badge";
import { BedDoubleIcon, MapIcon, PlaneIcon } from "lucide-react";

type TripFeatureBadgeVariant = "flights" | "itinerary" | "hotel";

interface TripFeatureBadgeProps {
  variant: TripFeatureBadgeVariant;
}

const FEATURE_CONFIG: Record<
  TripFeatureBadgeVariant,
  {
    label: string;
    Icon: typeof PlaneIcon;
  }
> = {
  flights: {
    label: "Flights",
    Icon: PlaneIcon,
  },
  hotel: {
    label: "Hotel",
    Icon: BedDoubleIcon,
  },
  itinerary: {
    label: "Itinerary",
    Icon: MapIcon,
  },
};

export function TripFeatureBadge({ variant }: TripFeatureBadgeProps) {
  const feature = FEATURE_CONFIG[variant];

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 bg-secondary/80 text-xs font-medium"
    >
      <feature.Icon className="size-3" />
      {feature.label}
    </Badge>
  );
}
