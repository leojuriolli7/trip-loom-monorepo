"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, InfoIcon, ArchiveRestoreIcon } from "lucide-react";
import { useSetAtom } from "jotai";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { DeleteTripButton } from "@/components/chat-shell-layout/delete-trip-button";
import { tripDetailsSheetAtom } from "@/components/trip-details-sheet";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { tripQueries } from "@/lib/api/react-query/trips";
import { formatTripDates } from "@/lib/format-trip-dates";
import { getTripTitle } from "@/lib/get-trip-title";

// Because this shell is rendered outside /chat/:id route, we need this workaround
function getChatId(pathname: string): string | null {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  return pathname.split("/")[2] ?? null;
}

export function ChatTopbar() {
  const pathname = usePathname();
  const chatId = getChatId(pathname);
  const setTripDetailsSheet = useSetAtom(tripDetailsSheetAtom);
  const queryClient = useQueryClient();
  const archiveTripMutation = useMutation(tripQueries.updateTrip());

  const { data: tripResult, status } = useQuery({
    ...tripQueries.getTripById(chatId ?? ""),
    enabled: Boolean(chatId),
  });

  const trip = tripResult?.data ?? null;

  const toggleTripArchived = async (shouldArchive: boolean) => {
    if (!trip || archiveTripMutation.isPending) {
      return;
    }

    try {
      const result = await archiveTripMutation.mutateAsync({
        tripId: trip.id,
        body: { archived: shouldArchive },
      });

      if (result.error) {
        throw new Error("Could not toggle archive status");
      }

      await queryClient.invalidateQueries({
        queryKey: tripQueries.base(),
      });
    } catch {
      toast.error(
        "Could not toggle archive status on this trip. Please try again.",
      );
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger />

          {chatId && status !== "pending" ? (
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-medium">
                  {trip ? getTripTitle(trip) : ""}
                </p>
              </div>
              <p className="truncate text-sm leading-none text-muted-foreground">
                {trip ? formatTripDates(trip) : ""}
              </p>
            </div>
          ) : null}
        </div>

        {trip ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full border border-border/60"
              aria-label={`Open details for ${getTripTitle(trip)}`}
              onClick={() =>
                setTripDetailsSheet({
                  tripId: trip.id,
                  isOpen: true,
                })
              }
            >
              <InfoIcon className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full border border-border/60"
              aria-label={
                trip.archived
                  ? `Unarchive ${getTripTitle(trip)}`
                  : `Archive ${getTripTitle(trip)}`
              }
              onClick={() => toggleTripArchived(!trip.archived)}
              disabled={archiveTripMutation.isPending}
            >
              {trip.archived ? (
                <ArchiveRestoreIcon className="size-4" />
              ) : (
                <ArchiveIcon className="size-4" />
              )}
            </Button>

            <DeleteTripButton tripId={trip.id} tripTitle={getTripTitle(trip)} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
