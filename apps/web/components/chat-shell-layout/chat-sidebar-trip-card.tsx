"use client";

import type { TripWithDestinationDTO } from "@trip-loom/contracts/dto";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { memo } from "react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { getTripTitle } from "@/lib/get-trip-title";
import { formatTripDates } from "@/lib/format-trip-dates";
import { prefetchChatHistory } from "@/lib/prefetch-chat-history";
import { useIsMobile } from "@/hooks/use-mobile";
import { TripStatusBadge } from "@/components/trip-status-badge";

type ChatSidebarTripCardProps = {
  trip: TripWithDestinationDTO;
  isActive: boolean;
};

export const ChatSidebarTripCard = memo(function ChatSidebarTripCard({
  trip,
  isActive,
}: ChatSidebarTripCardProps) {
  const updatedLabel = `Updated ${formatDistanceToNow(new Date(trip.updatedAt), {
    addSuffix: true,
  })}`;

  const queryClient = useQueryClient();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <SidebarMenuItem
      onMouseOver={() => prefetchChatHistory(queryClient, trip.id)}
      onTouchStart={() => prefetchChatHistory(queryClient, trip.id)}
      onFocusCapture={() => prefetchChatHistory(queryClient, trip.id)}
      onClick={() => {
        if (isMobile) {
          toggleSidebar();
        }
      }}
    >
      <SidebarMenuButton
        asChild
        className="h-auto rounded-2xl py-3"
        isActive={isActive}
      >
        <Link href={`/chat/${trip.id}`}>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 text-sm font-medium leading-tight">
                {getTripTitle(trip)}
              </span>

              <TripStatusBadge
                status={trip.status}
                size="sm"
                className="shrink-0"
              />
            </div>

            <span className="truncate text-xs text-muted-foreground">
              {formatTripDates(trip)}
            </span>

            <span className="truncate text-[11px] text-muted-foreground/80">
              {updatedLabel}
            </span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

ChatSidebarTripCard.displayName = "ChatSidebarTripCard";
