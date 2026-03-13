import type { ItineraryMapPlace } from "../itinerary-map/types";

export type ItinerarySheetActivity = {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  googlePlaceId: string | null;
  googlePlaceDisplayName: string | null;
  googleMapsUrl: string | null;
  googleFormattedAddress: string | null;
  googleLat: number | null;
  googleLng: number | null;
  googlePlaceImageUrl: string | null;
};

export type ItinerarySheetDay = {
  id: string;
  dayNumber: number;
  date: string | null;
  title: string | null;
  notes: string | null;
  activities: ItinerarySheetActivity[];
};

export type ItinerarySheetData = {
  source: "suggested" | "saved";
  days: ItinerarySheetDay[];
};

export type ActiveMapView = {
  title: string;
  description: string;
  places: ItineraryMapPlace[];
  initialPosition?: google.maps.LatLngLiteral;
};
