"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPinIcon } from "lucide-react";
import Image from "next/image";
import type { RecommendedDestinationDTO } from "@trip-loom/api/dto";
import { useQueryClient } from "@tanstack/react-query";
import { destinationQueries } from "@/lib/api/react-query/destinations";
import { getCoverImage } from "@/lib/get-cover-image";

export type DestinationCardData = {
  id: string;
  name: string;
  country: string;
  description?: string | null;
  imageUrl?: string | null;
  imagesUrls?: RecommendedDestinationDTO["imagesUrls"] | null;
  matchReason?: string | null;
};

interface DestinationCardProps {
  destination: DestinationCardData;
  onClick?: () => void;
  prefetchOnHover?: boolean;
}

export function DestinationCard({
  destination,
  onClick,
  prefetchOnHover = true,
}: DestinationCardProps) {
  const queryClient = useQueryClient();
  const coverImage = destination.imageUrl ?? getCoverImage(destination.imagesUrls);

  const prefetchDestinationDetails = () => {
    if (!prefetchOnHover) {
      return;
    }

    void queryClient.prefetchQuery(
      destinationQueries.getDestinationDetail(destination.id),
    );
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/60 p-0 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
      /**
       * Optimization: Prefetch on hover or when touch starts over a card.
       */
      onMouseOver={prefetchDestinationDetails}
      onTouchStart={prefetchDestinationDetails}
      data-testid={`destination-card-${destination.id}`}
    >
      <div className="relative aspect-3/4 overflow-hidden">
        <Image
          src={coverImage}
          alt={destination.name}
          fill
          sizes="(max-width: 1024px) 100vw, 25vw"
          fetchPriority="high"
          loading="eager"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">
              {destination.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-white/80">
              <MapPinIcon className="size-3.5" />
              <span className="text-sm font-medium">{destination.country}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-3 p-0">
            <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
              {destination.description}
            </p>
          </CardContent>

          {destination.matchReason && (
            <CardFooter className="mt-3 p-0">
              <Badge
                variant="secondary"
                className="border-0 bg-white/15 text-xs font-medium text-white backdrop-blur-sm h-auto whitespace-normal"
              >
                {destination.matchReason}
              </Badge>
            </CardFooter>
          )}
        </div>
      </div>
    </Card>
  );
}
