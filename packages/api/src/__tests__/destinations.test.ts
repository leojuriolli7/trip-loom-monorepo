import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { Elysia } from "elysia";
import { destinationRoutes } from "../routes/destinations";
import { createTestContext } from "./utils/test-db";
import {
  createTestDestinations,
  createTestHotelsForTokyo,
} from "./fixtures/destinations";

// Test setup
const ctx = createTestContext("dest");
const TEST_REGION = "North America" as const;
const testDestinations = createTestDestinations(ctx.prefix, TEST_REGION);
const testHotels = createTestHotelsForTokyo(ctx.prefix, testDestinations[0].id);
const TEST_COUNTRY = testDestinations[0].country;
const app = new Elysia().use(destinationRoutes);

// Helper for making requests
const get = async (path: string) => {
  const res = await app.handle(new Request(`http://localhost${path}`));
  return { res, body: await res.json() };
};

describe("Destinations API", () => {
  beforeAll(async () => {
    await ctx.cleanup();
    await ctx.seed(testDestinations, testHotels);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("GET /api/destinations", () => {
    it("should return paginated list", async () => {
      const { res, body } = await get(`/api/destinations?country=${TEST_COUNTRY}`);

      expect(res.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("nextCursor");
      expect(body).toHaveProperty("hasMore");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(3);
    });

    it("should respect limit parameter", async () => {
      const { res, body } = await get(
        `/api/destinations?country=${TEST_COUNTRY}&limit=2`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.hasMore).toBe(true);
      expect(body.nextCursor).not.toBeNull();
    });

    it("should paginate correctly with cursor", async () => {
      // Get first page
      const { body: firstPage } = await get(
        `/api/destinations?country=${TEST_COUNTRY}&limit=2`,
      );

      expect(firstPage.data.length).toBe(2);
      expect(firstPage.nextCursor).not.toBeNull();

      // Get second page
      const { body: secondPage } = await get(
        `/api/destinations?country=${TEST_COUNTRY}&limit=2&cursor=${firstPage.nextCursor}`,
      );

      expect(secondPage.data.length).toBe(1);
      expect(secondPage.hasMore).toBe(false);

      // Ensure no duplicates between pages
      const firstIds = firstPage.data.map((d: { id: string }) => d.id);
      const secondIds = secondPage.data.map((d: { id: string }) => d.id);
      const overlap = firstIds.filter((id: string) => secondIds.includes(id));
      expect(overlap.length).toBe(0);
    });

    it("should filter by search term", async () => {
      const { res, body } = await get(
        `/api/destinations?country=${TEST_COUNTRY}&search=testtokyo`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        body.data.some(
          (d: { name: string }) => d.name.toLowerCase() === "testtokyo",
        ),
      ).toBe(true);
    });

    it("should filter by region", async () => {
      const { res, body } = await get(
        `/api/destinations?region=${TEST_REGION}&country=${TEST_COUNTRY}`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(3);
      expect(
        body.data.every(
          (d: { region: string; country: string }) =>
            d.region === TEST_REGION && d.country === TEST_COUNTRY,
        ),
      ).toBe(true);
    });

    it("should filter by highlight tag", async () => {
      const { res, body } = await get(
        `/api/destinations?region=${TEST_REGION}&country=${TEST_COUNTRY}&highlight=beaches`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe("TestBali");
    });
  });

  describe("GET /api/destinations/:id", () => {
    it("should return destination with hotel count", async () => {
      const testTokyoId = testDestinations[0].id;
      const { res, body } = await get(`/api/destinations/${testTokyoId}`);

      expect(res.status).toBe(200);
      expect(body.id).toBe(testTokyoId);
      expect(body.name).toBe("TestTokyo");
      expect(body.hotelCount).toBe(2);
    });

    it("should return 404 for non-existent ID", async () => {
      const { res, body } = await get("/api/destinations/nonexistent123");

      expect(res.status).toBe(404);
      expect(body.error).toBe("Not Found");
      expect(body.message).toBe("Destination not found");
    });
  });
});
