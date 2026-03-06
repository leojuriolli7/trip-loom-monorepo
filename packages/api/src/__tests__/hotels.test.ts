import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { hotelRoutes } from "../routes/hotels";
import {
  createJsonRequester,
  createTestApp,
  createTestContext,
} from "./harness";
import {
  createTestDestinations,
  createTestHotels,
} from "./fixtures/destinations";

// Test setup
const ctx = createTestContext("hotel");
const TEST_REGION = "North Africa" as const;
const testDestinations = createTestDestinations(ctx.prefix, TEST_REGION);
const testHotels = createTestHotels(ctx.prefix, testDestinations);
const app = createTestApp().use(hotelRoutes);
const request = createJsonRequester(app);

// Convenience references
const tokyoId = testDestinations[0].id;

describe("Hotels API", () => {
  beforeAll(async () => {
    await ctx.cleanup();
    await ctx.seedDestinationsAndHotels(testDestinations, testHotels);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("GET /api/hotels", () => {
    it("should return paginated list", async () => {
      const { res, body } = await request.get(`/api/hotels?destinationId=${tokyoId}`);

      expect(res.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("nextCursor");
      expect(body).toHaveProperty("hasMore");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(3); // 3 hotels in Tokyo
    });

    it("should respect limit parameter", async () => {
      const { res, body } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&limit=2`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.hasMore).toBe(true);
      expect(body.nextCursor).not.toBeNull();
    });

    it("should paginate correctly with cursor", async () => {
      // Get first page
      const { body: firstPage } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&limit=2`,
      );

      expect(firstPage.data.length).toBe(2);
      expect(firstPage.nextCursor).not.toBeNull();

      // Get second page
      const { body: secondPage } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&limit=2&cursor=${firstPage.nextCursor}`,
      );

      expect(secondPage.data.length).toBe(1);
      expect(secondPage.hasMore).toBe(false);

      // Ensure no duplicates between pages
      const firstIds = firstPage.data.map((h: { id: string }) => h.id);
      const secondIds = secondPage.data.map((h: { id: string }) => h.id);
      const overlap = firstIds.filter((id: string) => secondIds.includes(id));
      expect(overlap.length).toBe(0);
    });

    it("should filter by destinationId", async () => {
      const { res, body } = await request.get(`/api/hotels?destinationId=${tokyoId}`);

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(3); // 3 hotels in Tokyo
      expect(
        body.data.every(
          (h: { destinationId: string }) => h.destinationId === tokyoId,
        ),
      ).toBe(true);
    });

    it("should filter by priceRange", async () => {
      const { res, body } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&priceRange=luxury`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe("Luxury Palace Tokyo");
    });

    it("should filter by minRating", async () => {
      const { res, body } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&minRating=4`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(2); // 4-star and 5-star hotels in Tokyo
      expect(
        body.data.every((h: { rating: number }) => h.rating >= 4),
      ).toBe(true);
    });

    it("should filter by amenity", async () => {
      const { res, body } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&amenity=spa`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe("Luxury Palace Tokyo");
    });

    it("should filter by search term", async () => {
      const { res, body } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&search=shibuya`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        body.data.some((h: { name: string }) => h.name === "Hotel Sakura"),
      ).toBe(true);
    });

    it("should combine multiple filters", async () => {
      const { res, body } = await request.get(
        `/api/hotels?destinationId=${tokyoId}&minRating=4`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(2); // 4-star and 5-star in Tokyo
      expect(
        body.data.every(
          (h: { destinationId: string; rating: number }) =>
            h.destinationId === tokyoId && h.rating >= 4,
        ),
      ).toBe(true);
    });
  });

  describe("GET /api/hotels/:id", () => {
    it("should return hotel with destination info", async () => {
      const hotelId = testHotels[0].id;
      const { res, body } = await request.get(`/api/hotels/${hotelId}`);

      expect(res.status).toBe(200);
      expect(body.id).toBe(hotelId);
      expect(body.name).toBe("Hotel Sakura");
      expect(body.destinationName).toBe("TestTokyo");
      expect(body.destinationCountry).toBe(testDestinations[0].country);
    });

    it("should return 404 for non-existent ID", async () => {
      const { res, body } = await request.get("/api/hotels/nonexistent123");

      expect(res.status).toBe(404);
      expect(body.error).toBe("NotFound");
      expect(body.message).toBe("Hotel not found");
    });
  });
});
