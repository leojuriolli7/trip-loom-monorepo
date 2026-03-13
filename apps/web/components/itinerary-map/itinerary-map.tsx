"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import useMapTheme from "./use-map-theme";

type ItineraryMapProps = {
  initialPosition: google.maps.LatLngLiteral;
};

const MAP_STYLE = {
  width: "100%",
  height: "100%",
};

export function ItineraryMap({ initialPosition }: ItineraryMapProps) {
  const { mapBgColor, mapTheme } = useMapTheme();

  return (
    <APIProvider
      language={"en"}
      libraries={["places"]}
      apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY}
    >
      <Map
        style={MAP_STYLE}
        defaultCenter={initialPosition}
        defaultZoom={14}
        minZoom={5}
        styles={mapTheme}
        gestureHandling="greedy"
        // Both below disable default UI elements.
        disableDefaultUI
        clickableIcons={false}
        // This removes the 'keyboard shortcuts' button on the footer of the map.
        keyboardShortcuts={false}
        // Background color for the loading tiles.
        backgroundColor={mapBgColor}
      >
        {/* TODO: Itinerary cards here */}
      </Map>
    </APIProvider>
  );
}
