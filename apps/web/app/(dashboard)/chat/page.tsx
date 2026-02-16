/**
 * TODO: Chat Page Architecture - Trip-Centric Conversations
 *
 * This chat page follows a "trip-centric" conversation model rather than
 * traditional standalone chats. Key concepts:
 *
 * ## What is a Trip?
 * A Trip is the core entity that requires:
 * - destination (required) - The place user is traveling to
 * - At least ONE of the following:
 *   - flights (inbound, outbound, or both)
 *   - hotel booking
 *   - itinerary
 *
 * This ensures every Trip has a meaningful start/end date derived from bookings.
 *
 * ## Conversation States
 *
 * ### DRAFTS
 * - Exploratory conversations that haven't become Trips yet
 * - User might be asking "where should I go in July?" or decided on a
 *   destination but hasn't booked/planned anything yet
 * - Saved to DB but not yet a Trip
 * - Can be abandoned or eventually converted to a Trip
 *
 * ### CURRENT
 * - Active ongoing trips (user is currently on this trip)
 * - Useful for asking questions mid-trip: "What restaurants are near my hotel?"
 * - Has all Trip requirements met (destination + booking/itinerary)
 *
 * ### UPCOMING
 * - Future trips with confirmed bookings/itinerary
 * - Trip requirements met, start date is in the future
 *
 * ### PAST
 * - Completed trips
 * - Trip requirements met, end date has passed
 *
 * ## When does a Draft become a Trip?
 * When user books something (flight, hotel) OR creates an itinerary.
 * At that point, the conversation moves from DRAFTS to UPCOMING/CURRENT.
 *
 * ## Sidebar Structure
 * [+ New Conversation]
 *
 * DRAFTS
 *   └─ Planning summer vacation...
 *   └─ Where to go in December?
 *
 * CURRENT
 *   └─ Tokyo, Japan (Apr 10-20) <- user is on this trip now
 *
 * UPCOMING
 *   ├─ Barcelona, Spain (Jun 15-22)
 *   └─ Santorini, Greece (Aug 1-8)
 *
 * PAST
 *   ├─ Paris, France (Dec 2025)
 *   └─ Bali, Indonesia (Jul 2025)
 */

"use client";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
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
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";

import {
  CalendarIcon,
  MapPinIcon,
  MessageSquarePlusIcon,
  PenLineIcon,
  PlaneIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AirplaneSeatView } from "@/components/tools-ui/airplane-seat-view";
import { MOCK_SEAT_ROWS } from "@/components/tools-ui/airplane-seat-view/_mocks";
import {
  currentTrips,
  drafts,
  mockMessages,
  pastTrips,
  upcomingTrips,
} from "./_mocks";

export default function ChatPage() {
  const handleSubmit = () => {
    // Mock - would send message to AI
  };

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="TripLoom" width={28} height={28} />
            <span className="font-semibold text-foreground">TripLoom</span>
          </Link>
          <Button className="mt-3 w-full justify-start gap-2" variant="outline">
            <MessageSquarePlusIcon className="size-4" />
            Plan a new Trip
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {/* Drafts */}
          {drafts.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
                Drafts
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {drafts.map((draft) => (
                    <SidebarMenuItem key={draft.id}>
                      <SidebarMenuButton className="h-auto py-2">
                        <PenLineIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm">
                            {draft.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {draft.updatedAt}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Current Trips */}
          {currentTrips.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
                Current
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {currentTrips.map((trip) => (
                    <SidebarMenuItem key={trip.id}>
                      <SidebarMenuButton isActive className="h-auto py-2">
                        <PlaneIcon className="size-4 shrink-0" />
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm font-medium">
                            {trip.destination}, {trip.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <CalendarIcon className="size-3" />
                            {trip.dates}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Upcoming Trips */}
          {upcomingTrips.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
                Upcoming
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {upcomingTrips.map((trip) => (
                    <SidebarMenuItem key={trip.id}>
                      <SidebarMenuButton className="h-auto py-2">
                        <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm">
                            {trip.destination}, {trip.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon className="size-3" />
                            {trip.dates}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Past Trips */}
          {pastTrips.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
                Past
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pastTrips.map((trip) => (
                    <SidebarMenuItem key={trip.id}>
                      <SidebarMenuButton className="h-auto py-2">
                        <MapPinIcon className="size-4 shrink-0 text-muted-foreground/60" />
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate text-sm text-muted-foreground">
                            {trip.destination}, {trip.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <CalendarIcon className="size-3" />
                            {trip.dates}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between gap-2">
            <UserAvatar variant="full" />
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex min-h-0 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <PlaneIcon className="size-4 text-primary" />
            <span className="font-medium">Tokyo, Japan</span>
            <span className="text-sm text-muted-foreground">
              · Apr 10-20, 2026
            </span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
              {mockMessages.map((msg) => (
                <Message key={msg.id} from={msg.from}>
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                    {msg.widget?.type === "seat-picker" && (
                      <div className="mt-4">
                        <AirplaneSeatView
                          rows={MOCK_SEAT_ROWS}
                          initialSelectedSeatId={
                            msg.widget.data.initialSelectedSeatId
                          }
                          cabinClass={msg.widget.data.cabinClass}
                          flightNumber={msg.widget.data.flightNumber}
                          flightInfo={msg.widget.data.flightInfo}
                          onConfirm={(seatId, price) => {
                            // TODO: Will trigger AI booking flow
                            console.log(
                              `Confirmed seat ${seatId} for $${price}`,
                            );
                          }}
                          onCancel={() => {
                            // TODO: Will close the widget/cancel booking
                            console.log("Cancelled seat selection");
                          }}
                          onRequestChanges={(message) => {
                            // TODO: Will send message to AI
                            console.log(`Request changes: ${message}`);
                          }}
                        />
                      </div>
                    )}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
          </Conversation>

          {/* Input Area */}
          {/*
            TODO: Add suggestions: Initial suggestions when page empty and separate agent to generate suggestions
            on-the-fly after each message.
            */}
          <div className="shrink-0 border-t border-border/60 bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <PromptInput
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <PromptInputTextarea
                  placeholder="Ask about your trip, book flights, find hotels..."
                  className="min-h-4 resize-none border-0 bg-transparent focus-visible:ring-0"
                />
                <PromptInputFooter className="justify-end p-2 pt-0">
                  <PromptInputSubmit />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
