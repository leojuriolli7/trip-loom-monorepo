"use client";

import { motion } from "motion/react";
import { ItineraryMap } from "../itinerary-map/itinerary-map";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { springs } from "@/lib/motion";
import { ActiveMapView } from "./types";

export function ItineraryMapDialog({
  clearMapState,
  mapState,
}: {
  mapState: ActiveMapView | null;
  clearMapState: () => void;
}) {
  const layoutId = mapState?.sourceDayId
    ? `map-preview-${mapState.sourceDayId}`
    : undefined;

  return (
    <Dialog
      open={mapState !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          clearMapState();
        }
      }}
    >
      <DialogContent className="h-[min(92vh,920px)] max-w-[min(96vw,1480px)] overflow-hidden p-0 sm:max-w-[min(96vw,1480px)]">
        <DialogTitle className="sr-only">
          {mapState?.title || "Itinerary Map"}
        </DialogTitle>

        {mapState ? (
          <motion.div
            layoutId={layoutId}
            transition={springs.smooth}
            className="h-full min-h-0 bg-muted/20 p-0"
            style={{ borderRadius: 28 }}
          >
            <div className="h-full overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_24px_80px_-44px_rgba(15,23,42,0.5)]">
              <ItineraryMap
                initialPosition={mapState?.initialPosition}
                places={mapState.places}
              />
            </div>
          </motion.div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
