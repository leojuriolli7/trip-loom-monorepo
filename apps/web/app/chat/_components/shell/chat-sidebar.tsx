"use client";

import type { TripStatus, TripWithDestinationDTO } from "@trip-loom/api/dto";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageSquarePlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, type UIEvent } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { tripQueries } from "@/lib/api/react-query/trips";
import { focusChatInput } from "../chat-input-focus";
import { ChatSidebarSection } from "./chat-sidebar-section";
import { EmailVerificationBanner } from "./email-verification-banner";

const sectionOrder: TripStatus[] = [
  "draft",
  "current",
  "upcoming",
  "past",
  "cancelled",
];

function groupTripsByStatus(trips: TripWithDestinationDTO[]) {
  const groups: Record<TripStatus, TripWithDestinationDTO[]> = {
    draft: [],
    current: [],
    upcoming: [],
    past: [],
    cancelled: [],
  };

  for (const trip of trips) {
    groups[trip.status].push(trip);
  }

  return groups;
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const activeChatId = params.id as string;

  const {
    data: trips = [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(tripQueries.listTrips({ limit: 20 }));

  const tripGroups = useMemo(() => groupTripsByStatus(trips), [trips]);

  const handlePlanNewTrip = useCallback(() => {
    if (pathname === "/chat") {
      focusChatInput();
      return;
    }

    router.push("/chat", { scroll: false });
  }, [pathname, router]);

  const handleContentScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      const distanceToBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;

      if (distanceToBottom > 160 || !hasNextPage || isFetchingNextPage) {
        return;
      }

      void fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

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

      <SidebarContent className="px-2" onScroll={handleContentScroll}>
        {status === "pending" && (
          <div className="flex h-20 items-center justify-center">
            <Spinner className="size-5" />
          </div>
        )}

        {status === "error" && (
          <div className="px-2 py-3 text-xs text-destructive">
            Could not load trips.
          </div>
        )}

        {status === "success" && !trips.length && (
          <div className="px-2 py-3 text-xs text-destructive">
            You have no trips yet. Get started by planning a trip!
          </div>
        )}

        {sectionOrder.map((variant) => (
          <ChatSidebarSection
            key={variant}
            variant={variant}
            trips={tripGroups[variant]}
            activeChatId={activeChatId}
          />
        ))}

        {isFetchingNextPage && (
          <div className="flex justify-center px-2 py-2">
            <Spinner className="size-4" />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="min-h-18.25 border-t border-sidebar-border p-3">
        <EmailVerificationBanner />

        <div className="flex items-center justify-between gap-2">
          <UserAvatar variant="full" />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
