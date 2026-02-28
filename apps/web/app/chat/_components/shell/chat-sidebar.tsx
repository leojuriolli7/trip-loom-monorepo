"use client";

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

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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
import { EmailVerificationBanner } from "./email-verification-banner";
import { focusChatInput } from "../chat-input-focus";
import { currentTrips, drafts, pastTrips, upcomingTrips } from "../../_mocks";

function getActiveChatId(pathname: string) {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  return pathname.split("/")[2] ?? null;
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeChatId = getActiveChatId(pathname);

  const handlePlanNewTrip = () => {
    router.push("/chat", { scroll: false });
    focusChatInput();
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

      <SidebarContent className="px-2">
        {drafts.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Drafts
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {drafts.map((draft) => (
                  <SidebarMenuItem key={draft.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2"
                      isActive={activeChatId === draft.id}
                    >
                      <Link href={`/chat/${draft.id}`}>
                        <PenLineIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm">
                            {draft.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {draft.updatedAt}
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

        {currentTrips.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Current
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {currentTrips.map((trip) => (
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
                            {trip.destination}, {trip.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <CalendarIcon className="size-3" />
                            {trip.dates}
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

        {upcomingTrips.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Upcoming
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {upcomingTrips.map((trip) => (
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
                            {trip.destination}, {trip.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon className="size-3" />
                            {trip.dates}
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

        {pastTrips.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Past
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pastTrips.map((trip) => (
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
                            {trip.destination}, {trip.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <CalendarIcon className="size-3" />
                            {trip.dates}
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 min-h-[73px]">
        <EmailVerificationBanner />

        <div className="flex items-center justify-between gap-2">
          <UserAvatar variant="full" />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
