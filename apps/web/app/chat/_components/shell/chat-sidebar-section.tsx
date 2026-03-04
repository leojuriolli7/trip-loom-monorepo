"use client";

import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { memo } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { ChatSidebarTripCard } from "./chat-sidebar-trip-card";
import type { TripStatus } from "@trip-loom/api/enums";

const sectionLabels: Record<TripStatus, string> = {
  draft: "Drafts",
  current: "Current",
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
};

type ChatSidebarSectionProps = {
  variant: TripStatus;
  trips: TripWithDestinationDTO[];
  activeChatId: string | null;
};

export const ChatSidebarSection = memo(function ChatSidebarSection({
  variant,
  trips,
  activeChatId,
}: ChatSidebarSectionProps) {
  if (trips.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
        {sectionLabels[variant]}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {trips.map((trip) => (
            <ChatSidebarTripCard
              key={trip.id}
              variant={variant}
              trip={trip}
              isActive={activeChatId === trip.id}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

ChatSidebarSection.displayName = "ChatSidebarSection";
