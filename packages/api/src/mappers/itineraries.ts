import { itinerary, itineraryActivity, itineraryDay } from "../db/schema";

/**
 * Select fields for itinerary queries.
 */
export const itinerarySelectFields = {
  id: itinerary.id,
  tripId: itinerary.tripId,
  createdAt: itinerary.createdAt,
  updatedAt: itinerary.updatedAt,
} as const;

/**
 * Select fields for itinerary day queries.
 */
export const itineraryDaySelectFields = {
  id: itineraryDay.id,
  itineraryId: itineraryDay.itineraryId,
  dayNumber: itineraryDay.dayNumber,
  date: itineraryDay.date,
  title: itineraryDay.title,
  notes: itineraryDay.notes,
  createdAt: itineraryDay.createdAt,
  updatedAt: itineraryDay.updatedAt,
} as const;

/**
 * Select fields for itinerary activity queries.
 */
export const itineraryActivitySelectFields = {
  id: itineraryActivity.id,
  itineraryDayId: itineraryActivity.itineraryDayId,
  orderIndex: itineraryActivity.orderIndex,
  title: itineraryActivity.title,
  description: itineraryActivity.description,
  startTime: itineraryActivity.startTime,
  endTime: itineraryActivity.endTime,
  location: itineraryActivity.location,
  locationUrl: itineraryActivity.locationUrl,
  googlePlaceId: itineraryActivity.googlePlaceId,
  googlePlaceDisplayName: itineraryActivity.googlePlaceDisplayName,
  googleMapsUrl: itineraryActivity.googleMapsUrl,
  googleFormattedAddress: itineraryActivity.googleFormattedAddress,
  googleLat: itineraryActivity.googleLat,
  googleLng: itineraryActivity.googleLng,
  googlePlaceImageUrl: itineraryActivity.googlePlaceImageUrl,
  estimatedCostInCents: itineraryActivity.estimatedCostInCents,
  imageUrl: itineraryActivity.imageUrl,
  sourceUrl: itineraryActivity.sourceUrl,
  sourceName: itineraryActivity.sourceName,
  createdAt: itineraryActivity.createdAt,
  updatedAt: itineraryActivity.updatedAt,
} as const;

/**
 * Column selection for itinerary days in relational queries.
 * Used with Drizzle's .findFirst()/.findMany() with { with: { days: { columns } } }.
 */
export const itineraryDayColumns = {
  id: true,
  itineraryId: true,
  dayNumber: true,
  date: true,
  title: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Column selection for itinerary activities in relational queries.
 * Used with Drizzle's .findFirst()/.findMany() with { with: { activities: { columns } } }.
 */
export const itineraryActivityColumns = {
  id: true,
  itineraryDayId: true,
  orderIndex: true,
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  location: true,
  locationUrl: true,
  googlePlaceId: true,
  googlePlaceDisplayName: true,
  googleMapsUrl: true,
  googleFormattedAddress: true,
  googleLat: true,
  googleLng: true,
  googlePlaceImageUrl: true,
  estimatedCostInCents: true,
  imageUrl: true,
  sourceUrl: true,
  sourceName: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const itineraryActivityPlaceDetailsSelectFields = {
  id: itineraryActivity.id,
  itineraryDayId: itineraryActivity.itineraryDayId,
  googlePlaceId: itineraryActivity.googlePlaceId,
  googlePlaceDisplayName: itineraryActivity.googlePlaceDisplayName,
  googleMapsUrl: itineraryActivity.googleMapsUrl,
  googleFormattedAddress: itineraryActivity.googleFormattedAddress,
  googleLat: itineraryActivity.googleLat,
  googleLng: itineraryActivity.googleLng,
  googlePlaceImageUrl: itineraryActivity.googlePlaceImageUrl,
} as const;
