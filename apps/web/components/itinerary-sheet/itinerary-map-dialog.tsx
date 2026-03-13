"use client";

import { ItineraryMap } from "../itinerary-map/itinerary-map";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ActiveMapView } from "./types";

export function ItineraryMapDialog({
  clearMapState,
  mapState,
}: {
  mapState: ActiveMapView | null;
  clearMapState: () => void;
}) {
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
          <>
            <div className="h-full min-h-0 bg-muted/20 p-4 md:p-6">
              <div className="h-full overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_24px_80px_-44px_rgba(15,23,42,0.5)]">
                <ItineraryMap
                  initialPosition={mapState?.initialPosition}
                  places={mapState.places}
                />
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
