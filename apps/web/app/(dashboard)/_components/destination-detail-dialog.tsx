"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { HotelMiniCard } from "@/components/hotel-mini-card";
import { MapPinIcon, CalendarIcon, PlaneIcon, MapIcon } from "lucide-react";
import { destinationQueries } from "@/lib/api/react-query/destinations";

type DestinationDetailContentProps = {
  destinationId: string;
  onClose: () => void;
  isDrawer: boolean;
};

function DestinationDetailContent({
  destinationId,
  onClose,
  isDrawer,
}: DestinationDetailContentProps) {
  const { data, isPending, isError } = useQuery(
    destinationQueries.getDestinationDetail(destinationId),
  );

  const Header = React.useMemo(
    () => (isDrawer ? DrawerHeader : DialogHeader),
    [isDrawer],
  );

  const Title = React.useMemo(
    () => (isDrawer ? DrawerTitle : DialogTitle),
    [isDrawer],
  );

  if (isPending) {
    return (
      <div
        className="flex min-h-80 items-center justify-center"
        data-testid="destination-detail-loading"
      >
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <Image
          src="/colliseum.png"
          alt=""
          width={96}
          height={96}
          className="opacity-60"
        />
        <p className="text-destructive">Failed to load destination</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative aspect-video w-full shrink-0 overflow-hidden">
        {/* TODO: Add next/image back after images are on my CDN */}
        <img
          src={data.imageUrl ?? "/placeholder.png"}
          alt={data.name}
          // fill
          className="object-cover"
          // priority
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Header className="p-0">
            <div className="flex items-center gap-2">
              {data.region && (
                <Badge className="border-0 bg-white/20 text-xs text-white backdrop-blur-sm">
                  {data.region}
                </Badge>
              )}
            </div>
            <Title className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">
              {data.name}
            </Title>
            <div className="flex items-center gap-1.5 text-white/80">
              <MapPinIcon className="size-4" />
              <span className="text-sm font-medium">{data.country}</span>
            </div>
          </Header>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="space-y-4">
          {data.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data.description}
            </p>
          )}

          {data.bestTimeToVisit && (
            <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3">
              <CalendarIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Best time to visit
                </p>
                <p className="text-sm font-medium">{data.bestTimeToVisit}</p>
              </div>
            </div>
          )}

          {data.highlights && data.highlights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Highlights
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.highlights.map((highlight) => (
                  <Badge
                    key={highlight}
                    variant="outline"
                    className="text-xs capitalize"
                  >
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hotels */}
        {data.topHotels.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Top Hotels
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.topHotels.map((hotel) => (
                <HotelMiniCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        )}

        {/* AI Actions */}
        <div className="space-y-3 rounded-xl border-primary/30">
          <p>Ready to learn more?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button>
              <PlaneIcon className="mb-px" />
              Plan a trip
            </Button>
            <Button>
              <MapIcon className="mb-px" />
              Ask about activities
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

type DestinationDetailDialogProps = {
  destinationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DestinationDetailDialog({
  destinationId,
  open,
  onOpenChange,
}: DestinationDetailDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop === undefined || !destinationId) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[95dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
          showCloseButton={false}
          data-testid="destination-detail-dialog"
        >
          <DestinationDetailContent
            destinationId={destinationId}
            onClose={() => onOpenChange(false)}
            isDrawer={false}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent data-testid="destination-detail-drawer">
        <div className="max-h-[90dvh] overflow-y-auto no-scrollbar">
          <DestinationDetailContent
            destinationId={destinationId}
            onClose={() => onOpenChange(false)}
            isDrawer
          />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
