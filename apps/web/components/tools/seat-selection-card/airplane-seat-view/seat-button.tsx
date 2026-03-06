"use client";

import * as React from "react";
import type { FlightSeat } from "@trip-loom/contracts/dto";
import { cn } from "@/lib/utils";

interface SeatButtonProps {
  seat: FlightSeat;
  isSelected: boolean;
  onSelect: (seat: FlightSeat) => void;
}

export const SeatButton = React.memo(function SeatButton({
  seat,
  isSelected,
  onSelect,
}: SeatButtonProps) {
  const handleClick = React.useCallback(() => {
    if (!seat.isBooked) {
      onSelect(seat);
    }
  }, [seat, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={seat.isBooked}
      aria-label={`Seat ${seat.id}, ${seat.isBooked ? "booked" : "available"}`}
      aria-pressed={isSelected}
      className={cn(
        "relative flex h-12 w-11 flex-col items-center justify-center rounded-lg transition-all duration-200",
        "text-xs font-semibold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        seat.isBooked && [
          "cursor-not-allowed bg-muted/80 text-muted-foreground/40",
          "dark:bg-muted/40",
        ],
        !seat.isBooked &&
          !isSelected && [
            "cursor-pointer bg-card hover:bg-secondary",
            "border border-border/60 hover:border-primary/40",
            "shadow-sm hover:shadow-md hover:scale-105",
            "active:scale-95",
          ],
        isSelected && [
          "cursor-pointer bg-primary text-primary-foreground",
          "border-2 border-primary",
          "shadow-lg shadow-primary/25",
          "scale-105",
        ],
      )}
    >
      <span
        className={cn(
          "text-[11px] font-bold tracking-wide",
          isSelected && "text-primary-foreground",
          seat.isBooked && "text-muted-foreground/40",
        )}
      >
        {seat.id}
      </span>
    </button>
  );
});
