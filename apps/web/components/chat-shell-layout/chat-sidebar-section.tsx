"use client";

import type { TripWithDestinationDTO } from "@trip-loom/contracts/dto";
import { ChevronDownIcon } from "lucide-react";
import { memo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChatSidebarTripCard } from "./chat-sidebar-trip-card";
import type { TripStatus } from "@trip-loom/contracts/enums";

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
  const [isOpen, setIsOpen] = useState(true);

  if (trips.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarGroupLabel
          asChild
          className="text-xs font-medium text-muted-foreground px-0"
        >
          <CollapsibleTrigger className="w-full justify-between px-2 transition-colors hover:text-foreground focus-visible:outline-none">
            <span>{sectionLabels[variant]}</span>
            <ChevronDownIcon
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200",
                !isOpen && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
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
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
});

ChatSidebarSection.displayName = "ChatSidebarSection";
