export type ItineraryMapPlace = {
  activityId: string;
  dayId: string;
  dayNumber: number;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  placeId: string;
  displayName: string | null;
  address: string | null;
  mapsUrl: string | null;
  lat: number;
  lng: number;
};
