"use client";

import { useQuery } from "@tanstack/react-query";
import { getTripTitle } from "@/lib/get-trip-title";
import { formatTripDates } from "@/lib/format-trip-dates";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { tripQueries } from "@/lib/api/react-query/trips";
import { usePathname } from "next/navigation";

function getChatId(pathname: string): string | null {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  return pathname.split("/")[2] ?? null;
}

export function ChatTopbar() {
  const pathname = usePathname();
  const chatId = getChatId(pathname);

  const { data: tripResult } = useQuery({
    ...tripQueries.getTripById(chatId ?? ""),
    enabled: Boolean(chatId),
  });

  const trip = tripResult?.data ?? null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />

        {chatId ? (
          <div>
            <p className="truncate font-medium">
              {trip ? getTripTitle(trip) : "Trip conversation"}
            </p>
            <p className="truncate text-sm leading-none text-muted-foreground">
              {trip ? formatTripDates(trip) : "Trip details unavailable"}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}
