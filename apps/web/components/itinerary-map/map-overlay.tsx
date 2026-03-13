"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MapOverlayProps = {
  position: google.maps.LatLngLiteral;
  children: React.ReactNode;
  /**
   * The pane on which to display the overlay. Defaults to 'floatPane'.
   * Options: 'mapPane', 'overlayLayer', 'overlayShadow', 'overlayImage', 'floatPane', 'overlayMouseTarget', 'floatShadow'
   */
  pane?: string;
};

/**
 * Custom overlay component that renders React children on a Google Map
 * without requiring cloud-based maps or Map ID.
 *
 * This component creates a google.maps.OverlayView instance and uses
 * React portals to render children into the overlay container.
 */
export function MapOverlay({
  position,
  children,
  pane = "floatPane",
}: MapOverlayProps) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const overlayRef = useRef<{
    setMap: (map: google.maps.Map | null) => void;
    updatePosition: (position: google.maps.LatLngLiteral) => void;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    /**
     * Custom overlay class that extends google.maps.OverlayView
     * Handles positioning and lifecycle of the overlay element
     */
    class CustomOverlay extends google.maps.OverlayView {
      private position: google.maps.LatLng;
      private containerDiv: HTMLDivElement;

      constructor(pos: google.maps.LatLngLiteral) {
        super();
        this.position = new google.maps.LatLng(pos.lat, pos.lng);

        // Create container div for React portal
        this.containerDiv = document.createElement("div");
        this.containerDiv.style.position = "absolute";

        containerRef.current = this.containerDiv;
      }

      /**
       * Called when overlay is added to map
       * Adds container to specified pane and notifies React
       */
      onAdd() {
        const panes = this.getPanes();
        if (panes) {
          const targetPane = panes[pane as keyof google.maps.MapPanes];
          if (targetPane) {
            targetPane.appendChild(this.containerDiv);
            setContainer(this.containerDiv);
          }
        }
      }

      /**
       * Called whenever map properties change (zoom, pan, etc.)
       * Updates the position of the overlay container
       */
      draw() {
        const projection = this.getProjection();
        if (!projection) return;

        const point = projection.fromLatLngToDivPixel(this.position);
        if (point) {
          // Position the overlay - transform centers it horizontally and positions bottom at point
          this.containerDiv.style.left = `${point.x}px`;
          this.containerDiv.style.top = `${point.y}px`;
          this.containerDiv.style.transform = "translate(-50%, -100%)";
        }
      }

      /**
       * Called when overlay is removed from map
       * Cleans up the container element
       */
      onRemove() {
        if (this.containerDiv.parentElement) {
          this.containerDiv.parentElement.removeChild(this.containerDiv);
        }
        setContainer(null);
        containerRef.current = null;
      }

      /**
       * Updates the position of the overlay
       * @param newPosition - New lat/lng coordinates
       */
      updatePosition(newPosition: google.maps.LatLngLiteral) {
        this.position = new google.maps.LatLng(
          newPosition.lat,
          newPosition.lng,
        );
        this.draw();
      }

      /**
       * Gets the current container element
       */
      getContainer() {
        return this.containerDiv;
      }
    }

    // Create overlay instance and attach to map
    const overlay = new CustomOverlay(position);
    overlay.setMap(map);
    overlayRef.current = overlay;

    // Cleanup on unmount
    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pane]);

  // Update position when it changes
  useEffect(() => {
    if (overlayRef.current && overlayRef.current.updatePosition) {
      overlayRef.current.updatePosition(position);
    }
  }, [position]);

  // Render children into the overlay container using React portal
  if (!container) return null;

  return createPortal(children, container);
}
