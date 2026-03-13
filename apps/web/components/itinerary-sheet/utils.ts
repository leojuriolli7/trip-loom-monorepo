import { ItineraryMapPlace } from "../itinerary-map/types";
import { ItinerarySheetActivity, ItinerarySheetDay } from "./types";

export function getDayMapPlaces(day: ItinerarySheetDay) {
  return day.activities
    .map((activity) => getActivityMapPlace(day, activity))
    .filter((place): place is ItineraryMapPlace => place !== null);
}

export function getActivityMapPlace(
  day: ItinerarySheetDay,
  activity: ItinerarySheetActivity,
): ItineraryMapPlace | null {
  if (
    !activity.googlePlaceId ||
    activity.googleLat === null ||
    activity.googleLng === null
  ) {
    return null;
  }

  return {
    activityId: activity.id,
    dayId: day.id,
    dayNumber: day.dayNumber,
    title: activity.title,
    description: activity.description,
    startTime: activity.startTime,
    endTime: activity.endTime,
    placeId: activity.googlePlaceId,
    displayName: activity.googlePlaceDisplayName,
    address: activity.googleFormattedAddress,
    mapsUrl: activity.googleMapsUrl,
    lat: activity.googleLat,
    lng: activity.googleLng,
  };
}
