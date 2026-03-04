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
import {
  CalendarIcon,
  ChevronRightIcon,
  MapIcon,
  MapPinIcon,
  PlaneIcon,
  XIcon,
} from "lucide-react";
import { focusChatInput } from "@/lib/focus-chat-input";
import { destinationQueries } from "@/lib/api/react-query/destinations";
import { getCoverImage } from "@/lib/get-cover-image";

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
  const highlights = data?.highlights ?? [];

  const Header = React.useMemo(
    () => (isDrawer ? DrawerHeader : DialogHeader),
    [isDrawer],
  );

  const Title = React.useMemo(
    () => (isDrawer ? DrawerTitle : DialogTitle),
    [isDrawer],
  );

  const handleChatAction = () => {
    onClose();
    requestAnimationFrame(() => {
      focusChatInput();
    });
  };

  if (isPending) {
    return (
      <div
        className="flex min-h-80 flex-col items-center justify-center gap-3"
        data-testid="destination-detail-loading"
      >
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">
          Loading destination details...
        </p>
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
      <div className="relative aspect-video w-[90%] mx-auto rounded-[20px] sm:w-full sm:mx-0 sm:rounded-none shrink-0 overflow-hidden">
        <Image
          src={getCoverImage(data.imagesUrls)}
          alt={data.name}
          fill
          sizes="(max-width: 640px) 90vw, 100vw"
          className="object-cover"
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/15" />

        <div className="absolute inset-x-0 top-0 flex justify-end p-4 sm:p-5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="border border-white/30 bg-black/35 text-white hover:bg-black/55 hover:text-white"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close destination details</span>
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <Header className="space-y-2 p-0">
            <div className="flex flex-wrap items-center gap-2">
              {data.region && (
                <Badge
                  variant="secondary"
                  className="bg-background/90 text-foreground"
                >
                  {data.region}
                </Badge>
              )}
            </div>
            <Title className="text-left text-2xl font-semibold tracking-tight text-white drop-shadow-lg">
              {data.name}
            </Title>
            <div className="flex items-center gap-1.5 text-white/85">
              <MapPinIcon className="size-4" />
              <span className="text-sm font-medium">{data.country}</span>
            </div>
          </Header>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto no-scrollbar">
        <div className="relative space-y-5 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {data.bestTimeToVisit && (
              <DetailStatCard
                icon={CalendarIcon}
                label="Best time to visit"
                value={data.bestTimeToVisit}
              />
            )}

            <DetailStatCard
              icon={MapPinIcon}
              label="Country"
              value={data.country}
            />
          </div>

          {data.description && (
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-foreground text-semibold text-xs font-medium tracking-[0.12em] uppercase">
                About {data.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground font-semibold">
                  Highlights
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {highlights.map((highlight) => (
                  <Badge
                    key={highlight}
                    variant="secondary"
                    className="capitalize"
                  >
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Hotels */}
          {data.topHotels.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground font-semibold">
                  Top Hotels
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.topHotels.map((hotel) => (
                  <HotelMiniCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}

          {/* AI Actions */}
          <div className="rounded-2xl border border-primary/30 bg-linear-to-br from-primary/9 via-background to-background p-4">
            <p className="text-base font-semibold tracking-tight">
              Ready to learn more?
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button className="justify-between" onClick={handleChatAction}>
                <span className="inline-flex items-center gap-1.5">
                  <PlaneIcon className="size-4" />
                  Plan a trip
                </span>
                <ChevronRightIcon className="size-4 opacity-80" />
              </Button>
              <Button
                variant="outline"
                className="justify-between border-border/70 bg-background/80"
                onClick={handleChatAction}
              >
                <span className="inline-flex items-center gap-1.5">
                  <MapIcon className="size-4" />
                  Ask about activities
                </span>
                <ChevronRightIcon className="size-4 opacity-70" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-background/80 p-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
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
          className="flex max-h-[95dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
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
      <DrawerContent className="p-0" data-testid="destination-detail-drawer">
        <div className="max-h-[90dvh] overflow-y-auto no-scrollbar">
          <DestinationDetailContent
            destinationId={destinationId}
            onClose={() => onOpenChange(false)}
            isDrawer
          />
        </div>
        <DrawerFooter className="border-t border-border/60 pt-3">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
