"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import type { CSSProperties } from "react";
import { ItineraryPlaceCard } from "./itinerary-place-card";
import { MapOverlay } from "./map-overlay";
import type { ItineraryMapPlace } from "./types";
// import useMapTheme from "./use-map-theme";

type ItineraryMapProps = {
  places: ItineraryMapPlace[];
  initialPosition?: google.maps.LatLngLiteral;
};

const MAP_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
};

const FALLBACK_DEFAULT_COORDS = { lat: 40.4168, lng: -3.7038 };

function getFirstPlacePosition(
  places: ItineraryMapPlace[],
): google.maps.LatLngLiteral {
  const firstPlace = places[0];

  return firstPlace
    ? { lat: firstPlace.lat, lng: firstPlace.lng }
    : FALLBACK_DEFAULT_COORDS;
}

export function ItineraryMap({
  places,
  initialPosition: _initialPosition,
}: ItineraryMapProps) {
  // const { mapBgColor, mapTheme } = useMapTheme();
  const initialPosition = _initialPosition || getFirstPlacePosition(places);

  return (
    <APIProvider
      language="en"
      libraries={["places"]}
      apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY}
    >
      <Map
        style={MAP_STYLE}
        defaultCenter={initialPosition}
        defaultZoom={14}
        minZoom={5}
        // styles={mapTheme}
        gestureHandling="greedy"
        // Both below disable default UI elements.
        disableDefaultUI
        clickableIcons={false}
        // This removes the 'keyboard shortcuts' button on the footer of the map.
        keyboardShortcuts={false}
        // Background color for the loading tiles.
        // backgroundColor={mapBgColor}
      >
        {places.map((place) => (
          <MapOverlay
            key={place.activityId}
            position={{ lat: place.lat, lng: place.lng }}
          >
            <ItineraryPlaceCard place={place} />
          </MapOverlay>
        ))}
      </Map>
    </APIProvider>
  );
}
