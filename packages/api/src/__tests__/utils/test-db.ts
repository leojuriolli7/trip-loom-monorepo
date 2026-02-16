import { randomUUID } from "node:crypto";
import { like } from "drizzle-orm";
import { db } from "../../db";
import { destination, hotel } from "../../db/schema";
import { DB_NewDestination, DB_NewHotel } from "../../db/types";

/**
 * Creates a test context with isolated data using a unique prefix.
 * Each test file should create its own context to avoid data collision.
 *
 * @example
 * ```ts
 * const ctx = createTestContext("hotels");
 *
 * beforeAll(async () => {
 *   await ctx.cleanup();
 *   await ctx.seed(testDestinations, testHotels);
 * });
 *
 * afterAll(async () => {
 *   await ctx.cleanup();
 * });
 * ```
 */
export function createTestContext(name: string) {
  const prefix = `${name}_test_${Date.now()}_${randomUUID().slice(0, 8)}_`;

  return {
    /** Prefix used for all IDs in this test context */
    prefix,

    /**
     * Clean up all test data for this context.
     * Deletes hotels first (due to FK), then destinations.
     */
    async cleanup() {
      await db.delete(hotel).where(like(hotel.id, `${prefix}%`));
      await db.delete(destination).where(like(destination.id, `${prefix}%`));
    },

    /**
     * Seed destinations and hotels with deterministic timestamps.
     * All IDs should already include the prefix.
     */
    async seed(destinations: DB_NewDestination[], hotels: DB_NewHotel[] = []) {
      const baseTime = Date.parse("2024-01-01T00:00:00.000Z");

      // Insert destinations with deterministic timestamps for stable ordering
      if (destinations.length > 0) {
        const destinationRows = destinations.map((dest, index) => {
          const createdAt = new Date(baseTime + index * 1000);
          return {
            ...dest,
            createdAt: dest.createdAt ?? createdAt,
            updatedAt: dest.updatedAt ?? createdAt,
          };
        });

        await db.insert(destination).values(destinationRows);
      }

      // Insert hotels with a different base time to keep ordering deterministic
      if (hotels.length > 0) {
        const hotelBaseTime = baseTime + 86_400_000;
        const hotelRows = hotels.map((h, index) => {
          const createdAt = new Date(hotelBaseTime + index * 1000);
          return {
            ...h,
            createdAt: h.createdAt ?? createdAt,
            updatedAt: h.updatedAt ?? createdAt,
          };
        });

        await db.insert(hotel).values(hotelRows);
      }
    },
  };
}
