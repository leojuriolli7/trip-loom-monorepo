import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user, userPreference, trip, destination, itinerary } from "../db/schema";
import { destinationRoutes } from "../routes/destinations";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
} from "./harness";
import {
  createTestDestinations,
  createTestHotelsForTokyo,
} from "./fixtures/destinations";
import { generateId } from "../lib/nanoid";
import type { DB_NewDestination } from "../db/types";

// Test setup
const ctx = createTestContext("dest");
const TEST_REGION = "North America" as const;
const testDestinations = createTestDestinations(ctx.prefix, TEST_REGION);
const testHotels = createTestHotelsForTokyo(ctx.prefix, testDestinations[0].id);
const TEST_COUNTRY = testDestinations[0].country;
const app = createTestApp().use(destinationRoutes);
const request = createJsonRequester(app);
const authMock = createHeaderAuthMock(ctx.prefix);

describe("Destinations API", () => {
  beforeAll(async () => {
    await ctx.cleanup();
    await ctx.seedDestinationsAndHotels(testDestinations, testHotels);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("GET /api/destinations", () => {
    it("should return paginated list", async () => {
      const { res, body } = await request.get(
        `/api/destinations?country=${TEST_COUNTRY}`,
      );

      expect(res.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("nextCursor");
      expect(body).toHaveProperty("hasMore");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(3);
    });

    it("should respect limit parameter", async () => {
      const { res, body } = await request.get(
        `/api/destinations?country=${TEST_COUNTRY}&limit=2`,
      );

      expect(res.status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.hasMore).toBe(true);
      expect(body.nextCursor).not.toBeNull();
    });

    it("should paginate correctly with cursor", async () => {
      // Get first page
      const { body: firstPage } = await request.get(
        `/api/destinations?country=${TEST_COUNTRY}&limit=2`,
      );

      expect(firstPage.data.length).toBe(2);
      expect(firstPage.nextCursor).not.toBeNull();

      // Get second page
      const { body: secondPage } = await request.get(
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
      const { res, body } = await request.get(
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
      const { res, body } = await request.get(
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
      const { res, body } = await request.get(
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
      const { res, body } = await request.get(`/api/destinations/${testTokyoId}`);

      expect(res.status).toBe(200);
      expect(body.id).toBe(testTokyoId);
      expect(body.name).toBe("TestTokyo");
      expect(body.hotelCount).toBe(2);
    });

    it("should return 404 for non-existent ID", async () => {
      const { res, body } = await request.get("/api/destinations/nonexistent123");

      expect(res.status).toBe(404);
      expect(body.error).toBe("Not Found");
      expect(body.message).toBe("Destination not found");
    });
  });
});

describe("Destinations Recommendations API", () => {
  const primaryUserId = `${ctx.prefix}rec_user_${generateId()}`;
  const secondaryUserId = `${ctx.prefix}rec_user2_${generateId()}`;

  // Create destinations in different regions for recommendation tests
  const europeDestId = `${ctx.prefix}rec_dest_europe`;
  const asiaDestId = `${ctx.prefix}rec_dest_asia`;
  const africaDestId = `${ctx.prefix}rec_dest_africa`;
  const pastTripDestId = `${ctx.prefix}rec_dest_past`;

  const recDestinations: DB_NewDestination[] = [
    {
      id: europeDestId,
      name: "RecTestParis",
      country: "France",
      countryCode: "FR",
      region: "Europe",
      timezone: "Europe/Paris",
      imagesUrls: null,
      description: "City of lights",
      highlights: ["art", "culture", "food"],
      bestTimeToVisit: "Spring",
    },
    {
      id: asiaDestId,
      name: "RecTestTokyo",
      country: "Japan",
      countryCode: "JP",
      region: "East Asia",
      timezone: "Asia/Tokyo",
      imagesUrls: null,
      description: "Modern metropolis",
      highlights: ["culture", "food", "temples"],
      bestTimeToVisit: "Spring",
    },
    {
      id: africaDestId,
      name: "RecTestCairo",
      country: "Egypt",
      countryCode: "EG",
      region: "North Africa",
      timezone: "Africa/Cairo",
      imagesUrls: null,
      description: "Ancient wonders",
      highlights: ["history", "architecture"],
      bestTimeToVisit: "Winter",
    },
    {
      id: pastTripDestId,
      name: "RecTestBali",
      country: "Indonesia",
      countryCode: "ID",
      region: "Southeast Asia",
      timezone: "Asia/Makassar",
      imagesUrls: null,
      description: "Tropical paradise",
      highlights: ["beaches", "temples", "relaxation"],
      bestTimeToVisit: "Dry season",
    },
  ];

  beforeAll(async () => {
    authMock.enable();

    // Create test users
    await db.insert(user).values([
      {
        id: primaryUserId,
        name: "Primary Rec User",
        email: `${primaryUserId}@example.test`,
        emailVerified: true,
      },
      {
        id: secondaryUserId,
        name: "Secondary Rec User",
        email: `${secondaryUserId}@example.test`,
        emailVerified: true,
      },
    ]);

    // Seed recommendation test destinations
    const baseTime = Date.parse("2024-06-01T00:00:00.000Z");
    await db.insert(destination).values(
      recDestinations.map((dest, index) => ({
        ...dest,
        createdAt: new Date(baseTime + index * 1000),
        updatedAt: new Date(baseTime + index * 1000),
      }))
    );
  });

  beforeEach(async () => {
    // Clean up user preferences and trips before each test
    await db
      .delete(userPreference)
      .where(eq(userPreference.userId, primaryUserId));
    await db
      .delete(userPreference)
      .where(eq(userPreference.userId, secondaryUserId));
    await db.delete(trip).where(eq(trip.userId, primaryUserId));
    await db.delete(trip).where(eq(trip.userId, secondaryUserId));
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(user).where(eq(user.id, primaryUserId));
    await db.delete(user).where(eq(user.id, secondaryUserId));
    await db.delete(destination).where(eq(destination.id, europeDestId));
    await db.delete(destination).where(eq(destination.id, asiaDestId));
    await db.delete(destination).where(eq(destination.id, africaDestId));
    await db.delete(destination).where(eq(destination.id, pastTripDestId));
    authMock.restore();
  });

  describe("GET /api/destinations/recommended", () => {
    it("should return 401 without authentication", async () => {
      const { res, body } = await request.get("/api/destinations/recommended");

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return default destinations when user has no preferences", async () => {
      const { res, body } = await request.get(
        "/api/destinations/recommended",
        primaryUserId
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      // Each result should have matchReason and matchScore
      expect(body[0]).toHaveProperty("matchReason");
      expect(body[0]).toHaveProperty("matchScore");
      // Default destinations should have "Explore {region}" reason
      expect(body[0].matchReason).toMatch(/^Explore /);
    });

    it("should return recommendations based on preferred regions", async () => {
      // Set user preferences for Europe
      await db.insert(userPreference).values({
        id: `${ctx.prefix}pref_${generateId()}`,
        userId: primaryUserId,
        preferredRegions: ["Europe"],
        travelInterests: [],
      });

      const { res, body } = await request.get(
        "/api/destinations/recommended",
        primaryUserId
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      // Should include Europe destination with high score
      const europeResult = body.find(
        (d: { id: string }) => d.id === europeDestId
      );
      expect(europeResult).toBeDefined();
      expect(europeResult.matchScore).toBeGreaterThanOrEqual(3);
      expect(europeResult.matchReason.toLowerCase()).toContain("europe");
    });

    it("should return recommendations based on travel interests", async () => {
      // Set user preferences for culture and food
      await db.insert(userPreference).values({
        id: `${ctx.prefix}pref_${generateId()}`,
        userId: primaryUserId,
        preferredRegions: [],
        travelInterests: ["culture", "food"],
      });

      const { res, body } = await request.get(
        "/api/destinations/recommended",
        primaryUserId
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      // Paris and Tokyo both have culture and food highlights
      const matchingDests = body.filter(
        (d: { id: string }) => d.id === europeDestId || d.id === asiaDestId
      );
      expect(matchingDests.length).toBeGreaterThanOrEqual(1);

      // Should have positive score for highlight matches
      expect(matchingDests[0].matchScore).toBeGreaterThan(0);
    });

    it("should fall back to default recommendations when personalized query has no matches", async () => {
      await db.insert(userPreference).values({
        id: `${ctx.prefix}pref_${generateId()}`,
        userId: primaryUserId,
        preferredRegions: ["Central Asia"],
        travelInterests: ["wildlife"],
      });

      const { res, body } = await request.get(
        "/api/destinations/recommended",
        primaryUserId,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body.every((d: { matchScore: number }) => d.matchScore === 0)).toBe(
        true,
      );
      expect(
        body.some((d: { matchReason: string }) =>
          d.matchReason.startsWith("Explore "),
        ),
      ).toBe(true);
    });

    it("should factor in past trips for recommendations", async () => {
      // Create a past trip to Bali (beaches, temples, relaxation)
      // Note: Trip needs an itinerary to compute as 'past' (otherwise it's 'draft')
      const pastTripId = `${ctx.prefix}trip_past_${generateId()}`;
      await db.insert(trip).values({
        id: pastTripId,
        userId: primaryUserId,
        title: "Past Bali Trip",
        destinationId: pastTripDestId,
        startDate: "2024-01-01",
        endDate: "2024-01-10",
      });
      await db.insert(itinerary).values({
        id: `${ctx.prefix}itin_past_${generateId()}`,
        tripId: pastTripId,
      });

      const { res, body } = await request.get(
        "/api/destinations/recommended",
        primaryUserId
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      // Bali itself should be excluded (already visited)
      const baliResult = body.find(
        (d: { id: string }) => d.id === pastTripDestId
      );
      expect(baliResult).toBeUndefined();

      // Other destinations should be recommended based on visited highlights
      // Tokyo has temples (like Bali), so should score from travel history
      const tokyoResult = body.find(
        (d: { id: string }) => d.id === asiaDestId
      );
      if (tokyoResult) {
        expect(tokyoResult.matchScore).toBeGreaterThan(0);
      }
    });

    it("should respect limit parameter", async () => {
      const { res, body } = await request.get(
        "/api/destinations/recommended?limit=2",
        primaryUserId
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeLessThanOrEqual(2);
    });

    it("should combine preferences and travel history for scoring", async () => {
      // Set preferences for Europe
      await db.insert(userPreference).values({
        id: `${ctx.prefix}pref_${generateId()}`,
        userId: primaryUserId,
        preferredRegions: ["Europe"],
        travelInterests: ["art"],
      });

      // Also create a past trip to East Asia
      // Note: Trip needs an itinerary to compute as 'past' (otherwise it's 'draft')
      const pastTripId = `${ctx.prefix}trip_asia_${generateId()}`;
      await db.insert(trip).values({
        id: pastTripId,
        userId: primaryUserId,
        title: "Past Tokyo Trip",
        destinationId: asiaDestId,
        startDate: "2024-02-01",
        endDate: "2024-02-10",
      });
      await db.insert(itinerary).values({
        id: `${ctx.prefix}itin_asia_${generateId()}`,
        tripId: pastTripId,
      });

      const { res, body } = await request.get(
        "/api/destinations/recommended",
        primaryUserId
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      // Paris should be recommended (matches Europe preference + art interest)
      const parisResult = body.find(
        (d: { id: string }) => d.id === europeDestId
      );
      expect(parisResult).toBeDefined();
      expect(parisResult.matchScore).toBeGreaterThan(0);

      // Tokyo should be excluded (already visited)
      const tokyoResult = body.find(
        (d: { id: string }) => d.id === asiaDestId
      );
      expect(tokyoResult).toBeUndefined();
    });
  });
});
