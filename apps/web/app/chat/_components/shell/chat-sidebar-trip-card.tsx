"use client";

import type { TripStatus, TripWithDestinationDTO } from "@trip-loom/api/dto";
import { cva } from "class-variance-authority";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  PenLineIcon,
  PlaneIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { memo, useMemo } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { getTripTitle } from "@/lib/get-trip-title";
import { formatTripDates } from "@/lib/format-trip-dates";
import { prefetchChatHistory } from "@/lib/prefetch-chat-history";

const tripIcons: Record<TripStatus, LucideIcon> = {
  draft: PenLineIcon,
  current: PlaneIcon,
  upcoming: MapPinIcon,
  past: MapPinIcon,
  cancelled: MapPinIcon,
};

const tripCardIconVariants = cva("size-4 shrink-0", {
  variants: {
    variant: {
      draft: "text-muted-foreground",
      current: "",
      upcoming: "text-muted-foreground",
      past: "text-muted-foreground/60",
      cancelled: "text-muted-foreground/60",
    },
  },
});

const tripCardTitleVariants = cva("truncate text-sm", {
  variants: {
    variant: {
      draft: "",
      current: "font-medium",
      upcoming: "",
      past: "text-muted-foreground",
      cancelled: "text-muted-foreground",
    },
  },
});

const tripCardSubtitleVariants = cva("text-xs", {
  variants: {
    variant: {
      draft: "text-muted-foreground",
      current: "flex items-center gap-1",
      upcoming: "flex items-center gap-1 text-muted-foreground",
      past: "flex items-center gap-1 text-muted-foreground/60",
      cancelled: "flex items-center gap-1 text-muted-foreground/60",
    },
  },
});

type ChatSidebarTripCardProps = {
  variant: TripStatus;
  trip: TripWithDestinationDTO;
  isActive: boolean;
};

export const ChatSidebarTripCard = memo(function ChatSidebarTripCard({
  variant,
  trip,
  isActive,
}: ChatSidebarTripCardProps) {
  const isDraft = variant === "draft";
  const Icon = useMemo(() => tripIcons[variant], [variant]);

  const subtitle = isDraft
    ? `Updated ${formatDistanceToNow(new Date(trip.updatedAt), { addSuffix: true })}`
    : formatTripDates(trip);

  const queryClient = useQueryClient();

  return (
    <SidebarMenuItem
      onMouseOver={() => prefetchChatHistory(queryClient, trip.id)}
      onTouchStart={() => prefetchChatHistory(queryClient, trip.id)}
      onFocusCapture={() => prefetchChatHistory(queryClient, trip.id)}
    >
      <SidebarMenuButton asChild className="h-auto py-2" isActive={isActive}>
        <Link href={`/chat/${trip.id}`}>
          <Icon className={tripCardIconVariants({ variant })} />
          <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
            <span className={tripCardTitleVariants({ variant })}>
              {getTripTitle(trip)}
            </span>
            <span className={tripCardSubtitleVariants({ variant })}>
              {isDraft ? null : <CalendarIcon className="size-3" />}
              {subtitle}
            </span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

ChatSidebarTripCard.displayName = "ChatSidebarTripCard";
