import { trip, destination } from "../db/schema";
import type { TripWithDestinationDTO } from "../dto/trips";
import type { TripStatus } from "../enums";
import { computedTripStatusSql } from "../lib/trips/status";

/**
 * Base trip select fields (without computed status).
 * Status is added separately via computedTripStatusSql.
 */
export const tripSelectFields = {
  id: trip.id,
  userId: trip.userId,
  destinationId: trip.destinationId,
  title: trip.title,
  cancelledAt: trip.cancelledAt,
  startDate: trip.startDate,
  endDate: trip.endDate,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
  // Computed status from SQL CASE expression
  status: computedTripStatusSql,
} as const;

export const tripDestinationSelectFields = {
  id: destination.id,
  name: destination.name,
  country: destination.country,
  countryCode: destination.countryCode,
  imagesUrls: destination.imagesUrls,
} as const;

type DestinationSummaryRow = {
  id: string | null;
  name: string | null;
  country: string | null;
  countryCode: string | null;
  imagesUrls: Array<{ url: string; isCover: boolean; caption: string }> | null;
} | null;

/**
 * Row type returned from trip queries with computed status.
 * Note: status is computed via SQL CASE, not stored in DB.
 */
type TripWithDestinationRow = Omit<typeof trip.$inferSelect, "cancelledAt"> & {
  status: TripStatus;
  cancelledAt: Date | null;
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
    imagesUrls: value.imagesUrls,
  };
};

export const mapTripWithDestination = (
  row: TripWithDestinationRow,
): TripWithDestinationDTO => ({
  ...row,
  destination: mapTripDestination(row.destination),
});
