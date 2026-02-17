import { randomUUID } from "node:crypto";
import { like, or } from "drizzle-orm";
import { db } from "../../db";
import { destination, hotel, user } from "../../db/schema";
import type { DB_NewDestination, DB_NewHotel } from "../../db/types";

/**
 * Shared DB context for integration tests.
 *
 * - Creates a unique ID prefix per test file
 * - Provides deterministic timestamps for stable ordering assertions
 * - Cleans all prefixed user/domain data, including rows created by APIs that
 *   generate random IDs (via user-level cascading deletes)
 */
export function createTestContext(name: string) {
  const prefix = `${name}_test_${Date.now()}_${randomUUID().slice(0, 8)}_`;
  const baseTime = Date.parse("2024-01-01T00:00:00.000Z");

  const timestamp = (index: number, offsetMs = 0): Date =>
    new Date(baseTime + offsetMs + index * 1000);

  return {
    prefix,
    id: (suffix: string) => `${prefix}${suffix}`,
    email: (suffix: string) => `${prefix}${suffix}@example.test`,
    timestamp,

    /**
     * Removes all data owned by this test context.
     *
     * Notes:
     * - Deleting users first cascades trips, bookings, payments, itineraries,
     *   and user preferences, including records with non-prefixed random IDs.
     * - Destination/hotel data is cleaned by prefixed IDs.
     */
    async cleanup() {
      await db.delete(user).where(like(user.id, `${prefix}%`));
      await db
        .delete(hotel)
        .where(
          or(
            like(hotel.id, `${prefix}%`),
            like(hotel.destinationId, `${prefix}%`),
          ),
        );
      await db.delete(destination).where(like(destination.id, `${prefix}%`));
    },

    /**
     * Inserts destination/hotel fixtures with deterministic timestamps.
     */
    async seedDestinationsAndHotels(
      destinations: DB_NewDestination[],
      hotels: DB_NewHotel[] = [],
    ) {
      if (destinations.length > 0) {
        const destinationRows = destinations.map((dest, index) => {
          const createdAt = timestamp(index);
          return {
            ...dest,
            createdAt: dest.createdAt ?? createdAt,
            updatedAt: dest.updatedAt ?? createdAt,
          };
        });

        await db.insert(destination).values(destinationRows);
      }

      if (hotels.length > 0) {
        const hotelRows = hotels.map((row, index) => {
          const createdAt = timestamp(index, 86_400_000);
          return {
            ...row,
            createdAt: row.createdAt ?? createdAt,
            updatedAt: row.updatedAt ?? createdAt,
          };
        });

        await db.insert(hotel).values(hotelRows);
      }
    },
  };
}

