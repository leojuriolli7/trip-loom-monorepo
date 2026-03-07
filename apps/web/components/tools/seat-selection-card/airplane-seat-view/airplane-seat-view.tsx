"use client";

import * as React from "react";
import { format } from "date-fns";
import type {
  FlightSeat,
  FlightSeatMap,
} from "@trip-loom/contracts/dto";
import type { CabinClass } from "@trip-loom/contracts";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  XIcon,
  MessageSquareIcon,
  PlaneIcon,
} from "lucide-react";

import { SeatButton } from "./seat-button";
import { cn } from "@/lib/utils";
import { cabinClassLabels } from "@/lib/labels/cabin-class-labels";
import { formatDurationMinutes } from "@/lib/format-duration";

type SeatViewFlight = {
  id: string;
  flightNumber: string;
  departureAirportCode: string;
  departureCity: string;
  departureTime: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalTime: string;
  durationMinutes: number;
  cabinClass: CabinClass;
  seatMap: FlightSeatMap;
};

interface AirplaneSeatViewProps {
  title?: string;
  flight: SeatViewFlight;
  /**
   * Called when user confirms seat selection.
   */
  onConfirm: (seatId: string) => void;
  /**
   * Called when user cancels seat selection.
   */
  onCancel: () => void;
  /**
   * Called when user wants to request changes.
   */
  onRequestChanges?: (message: string) => void;
}

export function AirplaneSeatView({
  title = "Flight Suggestion",
  flight,
  onConfirm,
  onCancel,
  onRequestChanges,
}: AirplaneSeatViewProps) {
  const seatMap = flight.seatMap;

  const flightInfo = React.useMemo(() => {
    return {
      departureTime: format(new Date(flight.departureTime), "HH:mm"),
      fromCode: flight.departureAirportCode,
      fromCity: flight.departureCity,
      duration: formatDurationMinutes(flight.durationMinutes),
      arrivalTime: format(new Date(flight.arrivalTime), "HH:mm"),
      toCode: flight.arrivalAirportCode,
      toCity: flight.arrivalCity,
      cabinClass: cabinClassLabels[flight.cabinClass],
      flightNumber: flight.flightNumber,
    };
  }, [flight]);

  // State for selected seat
  const [selectedSeatId, setSelectedSeatId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    setSelectedSeatId(null);
  }, [flight.id]);

  // State for "request changes" input
  const [showChangeInput, setShowChangeInput] = React.useState(false);
  const [changeMessage, setChangeMessage] = React.useState("");
  const changeInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!onRequestChanges) {
      setShowChangeInput(false);
      setChangeMessage("");
    }
  }, [onRequestChanges]);

  const handleSeatSelect = React.useCallback((seat: FlightSeat) => {
    setSelectedSeatId(seat.id);
  }, []);

  const handleConfirm = React.useCallback(() => {
    if (selectedSeatId) {
      onConfirm(selectedSeatId);
    }
  }, [selectedSeatId, onConfirm]);

  const handleRequestChanges = React.useCallback(() => {
    setShowChangeInput(true);
    // Focus the input after it renders
    setTimeout(() => changeInputRef.current?.focus(), 0);
  }, []);

  const handleSubmitChanges = React.useCallback(() => {
    if (changeMessage.trim() && onRequestChanges) {
      onRequestChanges(changeMessage.trim());
      setChangeMessage("");
      setShowChangeInput(false);
    }
  }, [changeMessage, onRequestChanges]);

  const handleChangeKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitChanges();
      } else if (e.key === "Escape") {
        setShowChangeInput(false);
        setChangeMessage("");
      }
    },
    [handleSubmitChanges],
  );

  // Generate column headers from first row
  const columnHeaders = React.useMemo(() => {
    if (seatMap.length === 0) return [];
    const firstRow = seatMap[0];
    return firstRow.sections.map((section) =>
      section.map((seat) => seat.id.replace(/[0-9]/g, "")),
    );
  }, [seatMap]);

  return (
    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="bg-foreground px-4 py-4 text-background dark:bg-card dark:text-foreground">
        <h3 className="text-center text-lg font-bold tracking-tight">
          {title}
        </h3>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-border/40 bg-card shadow-sm dark:border-border" />
            <span className="text-background/70 dark:text-muted-foreground">
              Available
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-muted/80 dark:bg-muted/40" />
            <span className="text-background/70 dark:text-muted-foreground">
              Booked
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border-2 border-primary bg-primary shadow-md" />
            <span className="text-background/70 dark:text-muted-foreground">
              Selected
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-linear-to-b from-muted/30 to-muted/50 dark:from-muted/10 dark:to-muted/20">
        <div
          className="max-h-80 overflow-y-auto overscroll-contain px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          style={{
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="mb-3 flex items-center justify-center gap-0">
            <div className="w-6" />
            <div className="flex items-center">
              {columnHeaders.map((section, sectionIdx) => (
                <React.Fragment key={sectionIdx}>
                  <div className="flex gap-1.5">
                    {section.map((letter) => (
                      <div
                        key={letter}
                        className="flex h-6 w-11 items-center justify-center text-xs font-semibold text-muted-foreground"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  {sectionIdx < columnHeaders.length - 1 && (
                    <div className="w-6" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="w-6" />
          </div>

          <div className="flex flex-col gap-2">
            {seatMap.map((row) => (
              <div
                key={row.rowNumber}
                className="flex items-center justify-center gap-0"
              >
                <div className="flex w-6 items-center justify-center text-xs font-medium text-muted-foreground mr-2">
                  {row.rowNumber}
                </div>

                <div className="flex items-center">
                  {row.sections.map((section, sectionIdx) => (
                    <React.Fragment key={sectionIdx}>
                      <div
                        className={cn(
                          "flex gap-1.5 relative before:content-[''] before:absolute before:top-2/4 before:h-2/5 before:w-0.5 before:-translate-y-1/2 before:bg-secondary before:rounded-4xl",
                          sectionIdx === 0
                            ? "before:-left-2"
                            : "before:-right-2",
                        )}
                      >
                        {section.map((seat) => (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            isSelected={seat.id === selectedSeatId}
                            onSelect={handleSeatSelect}
                          />
                        ))}
                      </div>

                      {sectionIdx < row.sections.length - 1 && (
                        <div className="w-6" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex w-6 items-center justify-center text-xs font-medium text-muted-foreground ml-2">
                  {row.rowNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-card p-4">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">
              {flightInfo.departureTime}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {flightInfo.fromCode}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {flightInfo.fromCity}
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center px-3">
            <div className="flex w-full items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <PlaneIcon className="size-4 text-primary" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {flightInfo.duration}
            </p>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">
              {flightInfo.arrivalTime}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {flightInfo.toCode}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {flightInfo.toCity}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Cabin Class</span>
            <p className="font-semibold">{flightInfo.cabinClass}</p>
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground">Selected Seat</span>
            <p className="font-semibold">{selectedSeatId ?? "—"}</p>
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground">Flight No</span>
            <p className="font-semibold">{flightInfo.flightNumber}</p>
          </div>
        </div>

        {onRequestChanges && showChangeInput && (
          <div className="mb-4 flex gap-2 items-center">
            <input
              ref={changeInputRef}
              type="text"
              value={changeMessage}
              onChange={(e) => setChangeMessage(e.target.value)}
              onKeyDown={handleChangeKeyDown}
              placeholder="What would you like different?"
              className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowChangeInput(false);
                setChangeMessage("");
              }}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        )}

        {!showChangeInput && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            {onRequestChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestChanges}
                className="gap-1.5"
              >
                <MessageSquareIcon className="size-3.5" />
                Request changes
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedSeatId}
              className="gap-1.5"
            >
              Confirm
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
