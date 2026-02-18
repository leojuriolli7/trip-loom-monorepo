import { trip, destination } from "../db/schema";
import type { TripWithDestinationDTO } from "../dto/trips";

export const tripSelectFields = {
  id: trip.id,
  userId: trip.userId,
  destinationId: trip.destinationId,
  title: trip.title,
  status: trip.status,
  startDate: trip.startDate,
  endDate: trip.endDate,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
} as const;

export const tripDestinationSelectFields = {
  id: destination.id,
  name: destination.name,
  country: destination.country,
  countryCode: destination.countryCode,
  imageUrl: destination.imageUrl,
} as const;

type DestinationSummaryRow = {
  id: string | null;
  name: string | null;
  country: string | null;
  countryCode: string | null;
  imageUrl: string | null;
} | null;

type TripWithDestinationRow = typeof trip.$inferSelect & {
  destination: DestinationSummaryRow;
  hasFlights: boolean;
  hasHotel: boolean;
  hasItinerary: boolean;
};

const mapTripDestination = (
  value: DestinationSummaryRow,
): TripWithDestinationDTO["destination"] => {
  if (!value) {
    return null;
  }

  if (!value.id || !value.name || !value.country || !value.countryCode) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    country: value.country,
    countryCode: value.countryCode,
    imageUrl: value.imageUrl,
  };
};

export const mapTripWithDestination = (
  row: TripWithDestinationRow,
): TripWithDestinationDTO => ({
  ...row,
  destination: mapTripDestination(row.destination),
});
