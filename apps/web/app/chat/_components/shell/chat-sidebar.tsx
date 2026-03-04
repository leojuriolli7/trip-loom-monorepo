"use client";

import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  MessageSquarePlusIcon,
  PenLineIcon,
  PlaneIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { tripQueries } from "@/lib/api/react-query/trips";
import { EmailVerificationBanner } from "./email-verification-banner";
import { focusChatInput } from "../chat-input-focus";

function getActiveChatId(pathname: string): string | null {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  return pathname.split("/")[2] ?? null;
}

function getTripTitle(trip: TripWithDestinationDTO): string {
  if (trip.title) {
    return trip.title;
  }

  if (trip.destination?.name && trip.destination?.country) {
    return `${trip.destination.name}, ${trip.destination.country}`;
  }

  if (trip.destination?.name) {
    return trip.destination.name;
  }

  return "Untitled Trip";
}

function formatTripDates(trip: TripWithDestinationDTO): string {
  if (!trip.startDate || !trip.endDate) {
    return "Dates pending";
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}

type TripGroups = {
  draft: TripWithDestinationDTO[];
  current: TripWithDestinationDTO[];
  upcoming: TripWithDestinationDTO[];
  past: TripWithDestinationDTO[];
  cancelled: TripWithDestinationDTO[];
};

function groupTripsByStatus(trips: TripWithDestinationDTO[]): TripGroups {
  return trips.reduce<TripGroups>(
    (groups, trip) => {
      groups[trip.status].push(trip);
      return groups;
    },
    {
      draft: [],
      current: [],
      upcoming: [],
      past: [],
      cancelled: [],
    },
  );
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeChatId = getActiveChatId(pathname);

  const {
    data: trips = [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    status,
  } = useInfiniteQuery(tripQueries.listTrips({ limit: 20 }));

  const tripGroups = useMemo(() => groupTripsByStatus(trips), [trips]);

  const handlePlanNewTrip = () => {
    if (pathname === "/chat") {
      focusChatInput();
      return;
    }

    router.push("/chat", { scroll: false });
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/chat" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TripLoom" width={28} height={28} />
          <span className="font-semibold text-foreground">TripLoom</span>
        </Link>

        <Button
          type="button"
          className="mt-3 w-full justify-start gap-2"
          variant="outline"
          onClick={handlePlanNewTrip}
        >
          <MessageSquarePlusIcon className="size-4" />
          Plan a new Trip
        </Button>
      </SidebarHeader>

      <SidebarContent
        className="px-2"
        onScroll={(event) => {
          const element = event.currentTarget;
          const distanceToBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight;

          if (distanceToBottom > 160 || !hasNextPage || isFetchingNextPage) {
            return;
          }

          void fetchNextPage();
        }}
      >
        {isPending && (
          <div className="flex h-20 items-center justify-center">
            <Spinner className="size-5" />
          </div>
        )}

        {status === "error" && (
          <div className="px-2 py-3 text-xs text-destructive">
            Could not load trips.
          </div>
        )}

        {tripGroups.draft.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Drafts
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tripGroups.draft.map((trip) => (
                  <SidebarMenuItem key={trip.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2"
                      isActive={activeChatId === trip.id}
                    >
                      <Link href={`/chat/${trip.id}`}>
                        <PenLineIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm">
                            {getTripTitle(trip)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Updated{" "}
                            {formatDistanceToNow(new Date(trip.updatedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {tripGroups.current.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Current
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tripGroups.current.map((trip) => (
                  <SidebarMenuItem key={trip.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2"
                      isActive={activeChatId === trip.id}
                    >
                      <Link href={`/chat/${trip.id}`}>
                        <PlaneIcon className="size-4 shrink-0" />
                        <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm font-medium">
                            {getTripTitle(trip)}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <CalendarIcon className="size-3" />
                            {formatTripDates(trip)}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {tripGroups.upcoming.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Upcoming
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tripGroups.upcoming.map((trip) => (
                  <SidebarMenuItem key={trip.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2"
                      isActive={activeChatId === trip.id}
                    >
                      <Link href={`/chat/${trip.id}`}>
                        <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm">
                            {getTripTitle(trip)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon className="size-3" />
                            {formatTripDates(trip)}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {tripGroups.past.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Past
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tripGroups.past.map((trip) => (
                  <SidebarMenuItem key={trip.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2"
                      isActive={activeChatId === trip.id}
                    >
                      <Link href={`/chat/${trip.id}`}>
                        <MapPinIcon className="size-4 shrink-0 text-muted-foreground/60" />
                        <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm text-muted-foreground">
                            {getTripTitle(trip)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <CalendarIcon className="size-3" />
                            {formatTripDates(trip)}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {tripGroups.cancelled.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Cancelled
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tripGroups.cancelled.map((trip) => (
                  <SidebarMenuItem key={trip.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2"
                      isActive={activeChatId === trip.id}
                    >
                      <Link href={`/chat/${trip.id}`}>
                        <MapPinIcon className="size-4 shrink-0 text-muted-foreground/60" />
                        <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm text-muted-foreground">
                            {getTripTitle(trip)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <CalendarIcon className="size-3" />
                            {formatTripDates(trip)}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center px-2 py-2">
            <Spinner className="size-4" />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="min-h-[73px] border-t border-sidebar-border p-3">
        <EmailVerificationBanner />

        <div className="flex items-center justify-between gap-2">
          <UserAvatar variant="full" />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
