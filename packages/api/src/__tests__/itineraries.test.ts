import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from "bun:test";
import { db } from "../db";
import {
  itinerary,
  itineraryActivity,
  itineraryDay,
  trip,
  user,
} from "../db/schema";
import { itineraryRoutes } from "../routes/itineraries";
import { googleMapsProvider } from "../lib/google-maps/provider";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
  dateWithOffset,
} from "./harness";

const ctx = createTestContext("itinerary");
const app = createTestApp().use(itineraryRoutes);
const request = createJsonRequester(app);
const requestJson = request.requestJson;
const authMock = createHeaderAuthMock(ctx.prefix);
const getPlaceImageUrlSpy = spyOn(googleMapsProvider, "getPlaceImageUrl");

type SeedData = {
  primaryUserId: string;
  secondaryUserId: string;
  tripWithItineraryId: string;
  tripWithoutItineraryId: string;
  secondaryTripId: string;
  itineraryId: string;
  day1Id: string;
  day2Id: string;
  activity1Id: string;
  activity2Id: string;
  activity3Id: string;
};

let seed: SeedData;

const cleanupFixtureData = async () => {
  await ctx.cleanup();
};

const seedFixtureData = async () => {
  const baseTime = Date.parse("2025-06-01T00:00:00.000Z");
  const primaryUserId = `${ctx.prefix}user_primary`;
  const secondaryUserId = `${ctx.prefix}user_secondary`;

  const tripWithItineraryId = `${ctx.prefix}trip_with_itinerary`;
  const tripWithoutItineraryId = `${ctx.prefix}trip_without_itinerary`;
  const secondaryTripId = `${ctx.prefix}trip_secondary`;

  const itineraryId = `${ctx.prefix}itinerary_main`;
  const day1Id = `${ctx.prefix}day_1`;
  const day2Id = `${ctx.prefix}day_2`;
  const activity1Id = `${ctx.prefix}activity_1`;
  const activity2Id = `${ctx.prefix}activity_2`;
  const activity3Id = `${ctx.prefix}activity_3`;

  // Create users
  await db.insert(user).values([
    {
      id: primaryUserId,
      name: "Primary User",
      email: `${primaryUserId}@example.test`,
      emailVerified: true,
    },
    {
      id: secondaryUserId,
      name: "Secondary User",
      email: `${secondaryUserId}@example.test`,
      emailVerified: true,
    },
  ]);

  // Create trips
  await db.insert(trip).values([
    {
      id: tripWithItineraryId,
      userId: primaryUserId,
      destinationId: null,
      title: "Trip With Itinerary",
      startDate: dateWithOffset(30),
      endDate: dateWithOffset(36),
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
    {
      id: tripWithoutItineraryId,
      userId: primaryUserId,
      destinationId: null,
      title: "Trip Without Itinerary",
      startDate: dateWithOffset(40),
      endDate: dateWithOffset(46),
      createdAt: new Date(baseTime + 1_000),
      updatedAt: new Date(baseTime + 1_000),
    },
    {
      id: secondaryTripId,
      userId: secondaryUserId,
      destinationId: null,
      title: "Secondary User Trip",
      startDate: dateWithOffset(50),
      endDate: dateWithOffset(56),
      createdAt: new Date(baseTime + 2_000),
      updatedAt: new Date(baseTime + 2_000),
    },
  ]);

  // Create itinerary for primary user's first trip
  await db.insert(itinerary).values({
    id: itineraryId,
    tripId: tripWithItineraryId,
    createdAt: new Date(baseTime + 3_000),
    updatedAt: new Date(baseTime + 3_000),
  });

  // Create days (day 2 first to test sorting)
  await db.insert(itineraryDay).values([
    {
      id: day2Id,
      itineraryId,
      dayNumber: 2,
      date: dateWithOffset(31),
      title: "Day Two",
      notes: "Notes for day two",
      createdAt: new Date(baseTime + 4_000),
      updatedAt: new Date(baseTime + 4_000),
    },
    {
      id: day1Id,
      itineraryId,
      dayNumber: 1,
      date: dateWithOffset(30),
      title: "Day One",
      notes: "Notes for day one",
      createdAt: new Date(baseTime + 5_000),
      updatedAt: new Date(baseTime + 5_000),
    },
  ]);

  // Create activities (out of order to test sorting)
  await db.insert(itineraryActivity).values([
    {
      id: activity2Id,
      itineraryDayId: day1Id,
      orderIndex: 1,
      title: "Lunch at Restaurant",
      description: "Try local cuisine",
      startTime: "12:00",
      endTime: "13:30",
      location: "Local Restaurant",
      locationUrl: "https://maps.example.com/restaurant",
      googlePlaceId: "test-place-restaurant",
      googlePlaceDisplayName: "Local Restaurant",
      googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:test-place-restaurant",
      googleFormattedAddress: "123 Market St, Test City",
      googleLat: 40.7128,
      googleLng: -74.006,
      estimatedCostInCents: 5000,
      createdAt: new Date(baseTime + 6_000),
      updatedAt: new Date(baseTime + 6_000),
    },
    {
      id: activity1Id,
      itineraryDayId: day1Id,
      orderIndex: 0,
      title: "Morning Coffee",
      description: "Start the day right",
      startTime: "08:00",
      endTime: "09:00",
      location: "Hotel Cafe",
      locationUrl: null,
      estimatedCostInCents: 1500,
      createdAt: new Date(baseTime + 7_000),
      updatedAt: new Date(baseTime + 7_000),
    },
    {
      id: activity3Id,
      itineraryDayId: day2Id,
      orderIndex: 0,
      title: "Museum Visit",
      description: "Visit the national museum",
      startTime: "10:00",
      endTime: "14:00",
      location: "National Museum",
      locationUrl: "https://maps.example.com/museum",
      estimatedCostInCents: 2500,
      createdAt: new Date(baseTime + 8_000),
      updatedAt: new Date(baseTime + 8_000),
    },
  ]);

  seed = {
    primaryUserId,
    secondaryUserId,
    tripWithItineraryId,
    tripWithoutItineraryId,
    secondaryTripId,
    itineraryId,
    day1Id,
    day2Id,
    activity1Id,
    activity2Id,
    activity3Id,
  };
};

describe("Itineraries API", () => {
  beforeAll(async () => {
    authMock.enable();
  });

  beforeEach(async () => {
    getPlaceImageUrlSpy.mockReset();
    getPlaceImageUrlSpy.mockImplementation(async (placeId) =>
      placeId ? `https://images.example.com/${placeId}.jpg` : null,
    );
    await cleanupFixtureData();
    await seedFixtureData();
  });

  afterAll(async () => {
    await cleanupFixtureData();
    authMock.restore();
    getPlaceImageUrlSpy.mockRestore();
  });

  describe("Authentication", () => {
    it("all itinerary endpoints return 401 without auth", async () => {
      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary`,
        }),
        requestJson({
          method: "POST",
          path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary`,
          body: { days: [] },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary`,
        }),
        requestJson({
          method: "POST",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days`,
          body: { dayNumber: 3, date: dateWithOffset(32) },
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}`,
          body: { title: "Updated" },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}`,
        }),
        requestJson({
          method: "POST",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities`,
          body: { orderIndex: 2, title: "New Activity" },
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity1Id}`,
          body: { title: "Updated Activity" },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity1Id}`,
        }),
      ]);

      for (const response of calls) {
        expect(response.res.status).toBe(401);
        expect(response.body).toMatchObject({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }
    });
  });

  describe("Ownership Boundaries", () => {
    it("cannot access another user's trip itinerary", async () => {
      // Create itinerary for secondary user's trip
      const secondaryItineraryId = `${ctx.prefix}secondary_itinerary`;
      const secondaryDayId = `${ctx.prefix}secondary_day`;
      const secondaryActivityId = `${ctx.prefix}secondary_activity`;

      await db.insert(itinerary).values({
        id: secondaryItineraryId,
        tripId: seed.secondaryTripId,
      });

      await db.insert(itineraryDay).values({
        id: secondaryDayId,
        itineraryId: secondaryItineraryId,
        dayNumber: 1,
        date: dateWithOffset(50),
      });

      await db.insert(itineraryActivity).values({
        id: secondaryActivityId,
        itineraryDayId: secondaryDayId,
        orderIndex: 0,
        title: "Secondary Activity",
      });

      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.secondaryTripId}/itinerary`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.secondaryTripId}/itinerary`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.secondaryTripId}/itinerary/days/${secondaryDayId}`,
          userId: seed.primaryUserId,
          body: { title: "Hacked" },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.secondaryTripId}/itinerary/days/${secondaryDayId}`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.secondaryTripId}/itinerary/days/${secondaryDayId}/activities/${secondaryActivityId}`,
          userId: seed.primaryUserId,
          body: { title: "Hacked Activity" },
        }),
      ]);

      for (const call of calls) {
        expect(call.res.status).toBe(404);
        expect(call.body).toMatchObject({
          error: "NotFound",
        });
      }

      // Verify secondary user's data was not affected
      const activityRows = await db
        .select()
        .from(itineraryActivity)
        .where(eq(itineraryActivity.id, secondaryActivityId));
      expect(activityRows).toHaveLength(1);
      expect(activityRows[0]?.title).toBe("Secondary Activity");
    });
  });

  describe("GET /api/trips/:id/itinerary", () => {
    it("returns itinerary with days sorted by dayNumber and activities sorted by orderIndex", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body.id).toBe(seed.itineraryId);
      expect(body.tripId).toBe(seed.tripWithItineraryId);

      // Days should be sorted by dayNumber
      expect(body.days).toHaveLength(2);
      expect(body.days[0].dayNumber).toBe(1);
      expect(body.days[0].id).toBe(seed.day1Id);
      expect(body.days[1].dayNumber).toBe(2);
      expect(body.days[1].id).toBe(seed.day2Id);

      // Day 1 activities should be sorted by orderIndex
      expect(body.days[0].activities).toHaveLength(2);
      expect(body.days[0].activities[0].orderIndex).toBe(0);
      expect(body.days[0].activities[0].id).toBe(seed.activity1Id);
      expect(body.days[0].activities[0].title).toBe("Morning Coffee");
      expect(body.days[0].activities[1].orderIndex).toBe(1);
       expect(body.days[0].activities[1].id).toBe(seed.activity2Id);
       expect(body.days[0].activities[1].title).toBe("Lunch at Restaurant");
       expect(body.days[0].activities[1].googlePlaceId).toBe(
         "test-place-restaurant",
       );

      // Day 2 activities
      expect(body.days[1].activities).toHaveLength(1);
      expect(body.days[1].activities[0].id).toBe(seed.activity3Id);
    });

    it("returns 404 if no itinerary exists", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Itinerary not found",
      });
    });

    it("returns 404 for non-existent trip", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/nonexistent_trip_id/itinerary`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
      });
    });
  });

  describe("POST /api/trips/:id/itinerary", () => {
    it("creates an empty itinerary", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary`,
        userId: seed.primaryUserId,
        body: {},
      });

      expect(res.status).toBe(201);
      expect(body.tripId).toBe(seed.tripWithoutItineraryId);
      expect(body.days).toEqual([]);

      // Verify stored in DB
      const storedRows = await db
        .select()
        .from(itinerary)
        .where(eq(itinerary.tripId, seed.tripWithoutItineraryId));
      expect(storedRows).toHaveLength(1);
    });

    it("creates itinerary with days and activities in one call", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary`,
        userId: seed.primaryUserId,
        body: {
          days: [
            {
              dayNumber: 1,
              date: dateWithOffset(40),
              title: "Arrival Day",
              notes: "Check into hotel",
              activities: [
                {
                  orderIndex: 0,
                  title: "Airport Transfer",
                  description: "Taxi from airport",
                  startTime: "14:00",
                  endTime: "15:30",
                  location: "Airport",
                  googlePlaceId: "test-airport-place",
                  googlePlaceDisplayName: "Test International Airport",
                  googleMapsUrl:
                    "https://www.google.com/maps/place/?q=place_id:test-airport-place",
                  googleFormattedAddress: "1 Airport Way, Test City",
                  googleLat: 40.6413,
                  googleLng: -73.7781,
                  estimatedCostInCents: 3000,
                },
                {
                  orderIndex: 1,
                  title: "Hotel Check-in",
                  startTime: "16:00",
                  endTime: "17:00",
                },
              ],
            },
            {
              dayNumber: 2,
              date: dateWithOffset(41),
              title: "Exploration Day",
              activities: [
                {
                  orderIndex: 0,
                  title: "City Tour",
                  startTime: "09:00",
                  endTime: "12:00",
                  estimatedCostInCents: 5000,
                },
              ],
            },
          ],
        },
      });

      expect(res.status).toBe(201);
      expect(body.tripId).toBe(seed.tripWithoutItineraryId);
      expect(body.days).toHaveLength(2);

      // Day 1
      expect(body.days[0].dayNumber).toBe(1);
      expect(body.days[0].title).toBe("Arrival Day");
      expect(body.days[0].activities).toHaveLength(2);
      expect(body.days[0].activities[0].title).toBe("Airport Transfer");
      expect(body.days[0].activities[0].estimatedCostInCents).toBe(3000);
      expect(body.days[0].activities[0].googlePlaceId).toBe("test-airport-place");
      expect(body.days[0].activities[0].googleLat).toBe(40.6413);
      expect(body.days[0].activities[0].googlePlaceImageUrl).toBe(
        "https://images.example.com/test-airport-place.jpg",
      );
      expect(body.days[0].activities[1].title).toBe("Hotel Check-in");

      // Day 2
      expect(body.days[1].dayNumber).toBe(2);
      expect(body.days[1].title).toBe("Exploration Day");
      expect(body.days[1].activities).toHaveLength(1);
      expect(body.days[1].activities[0].title).toBe("City Tour");
    });

    it("returns 409 if itinerary already exists", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary`,
        userId: seed.primaryUserId,
        body: {},
      });

      expect(res.status).toBe(409);
      expect(body).toMatchObject({
        error: "Conflict",
        message: "Itinerary already exists for this trip",
      });
    });

    it("rolls back itinerary creation when nested day numbers conflict", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary`,
        userId: seed.primaryUserId,
        body: {
          days: [
            {
              dayNumber: 1,
              date: dateWithOffset(40),
            },
            {
              dayNumber: 1,
              date: dateWithOffset(41),
            },
          ],
        },
      });

      expect(res.status).toBe(409);
      expect(body).toMatchObject({
        error: "Conflict",
        message:
          "Itinerary payload has duplicate dayNumber or duplicate activity orderIndex",
      });

      const itineraryRows = await db
        .select({ id: itinerary.id })
        .from(itinerary)
        .where(eq(itinerary.tripId, seed.tripWithoutItineraryId));
      expect(itineraryRows).toHaveLength(0);
    });

    it("returns 404 for non-existent trip", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/nonexistent_trip_id/itinerary`,
        userId: seed.primaryUserId,
        body: {},
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Trip not found",
      });
    });
  });

  describe("DELETE /api/trips/:id/itinerary", () => {
    it("deletes entire itinerary (cascades to days and activities)", async () => {
      const { res } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(204);

      // Verify itinerary deleted
      const itineraryRows = await db
        .select()
        .from(itinerary)
        .where(eq(itinerary.id, seed.itineraryId));
      expect(itineraryRows).toHaveLength(0);

      // Verify days deleted
      const dayRows = await db
        .select()
        .from(itineraryDay)
        .where(eq(itineraryDay.itineraryId, seed.itineraryId));
      expect(dayRows).toHaveLength(0);

      // Verify activities deleted
      const activityRows = await db
        .select()
        .from(itineraryActivity)
        .where(eq(itineraryActivity.itineraryDayId, seed.day1Id));
      expect(activityRows).toHaveLength(0);
    });

    it("returns 404 if no itinerary exists", async () => {
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Itinerary not found",
      });
    });
  });

  describe("POST /api/trips/:id/itinerary/days", () => {
    it("adds a day and returns full itinerary", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days`,
        userId: seed.primaryUserId,
        body: {
          dayNumber: 3,
          date: dateWithOffset(32),
          title: "Day Three",
          notes: "Final day notes",
        },
      });

      expect(res.status).toBe(201);
      expect(body.days).toHaveLength(3);

      // Days should be sorted
      expect(body.days[0].dayNumber).toBe(1);
      expect(body.days[1].dayNumber).toBe(2);
      expect(body.days[2].dayNumber).toBe(3);
      expect(body.days[2].title).toBe("Day Three");
      expect(body.days[2].notes).toBe("Final day notes");
    });

    it("returns 404 if no itinerary exists", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithoutItineraryId}/itinerary/days`,
        userId: seed.primaryUserId,
        body: {
          dayNumber: 1,
          date: dateWithOffset(40),
        },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Itinerary not found",
      });
    });
  });

  describe("PATCH /api/trips/:id/itinerary/days/:dayId", () => {
    it("updates day fields", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}`,
        userId: seed.primaryUserId,
        body: {
          title: "Updated Day One",
          notes: "Updated notes",
        },
      });

      expect(res.status).toBe(200);
      const updatedDay = body.days.find(
        (d: { id: string }) => d.id === seed.day1Id,
      );
      expect(updatedDay.title).toBe("Updated Day One");
      expect(updatedDay.notes).toBe("Updated notes");
    });

    it("can update dayNumber and date", async () => {
      const newDate = dateWithOffset(35);

      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}`,
        userId: seed.primaryUserId,
        body: {
          dayNumber: 5,
          date: newDate,
        },
      });

      expect(res.status).toBe(200);

      // Day should now be sorted last due to higher dayNumber
      const updatedDay = body.days.find(
        (d: { id: string }) => d.id === seed.day1Id,
      );
      expect(updatedDay.dayNumber).toBe(5);
      expect(updatedDay.date).toBe(newDate);
    });

    it("can set title and notes to null", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}`,
        userId: seed.primaryUserId,
        body: {
          title: null,
          notes: null,
        },
      });

      expect(res.status).toBe(200);
      const updatedDay = body.days.find(
        (d: { id: string }) => d.id === seed.day1Id,
      );
      expect(updatedDay.title).toBeNull();
      expect(updatedDay.notes).toBeNull();
    });

    it("returns 404 for non-existent day", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/nonexistent_day`,
        userId: seed.primaryUserId,
        body: { title: "Test" },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Day not found",
      });
    });
  });

  describe("DELETE /api/trips/:id/itinerary/days/:dayId", () => {
    it("deletes day and renumbers remaining days", async () => {
      // Day 1 has dayNumber 1, Day 2 has dayNumber 2
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body.days).toHaveLength(1);

      // Day 2 should now be dayNumber 1
      expect(body.days[0].id).toBe(seed.day2Id);
      expect(body.days[0].dayNumber).toBe(1);

      // Verify activities for day 1 are deleted
      const activityRows = await db
        .select()
        .from(itineraryActivity)
        .where(eq(itineraryActivity.itineraryDayId, seed.day1Id));
      expect(activityRows).toHaveLength(0);
    });

    it("returns 404 for non-existent day", async () => {
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/nonexistent_day`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Day not found",
      });
    });
  });

  describe("POST /api/trips/:id/itinerary/days/:dayId/activities", () => {
    it("adds activity to a day", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities`,
        userId: seed.primaryUserId,
        body: {
          orderIndex: 2,
          title: "Evening Dinner",
          description: "Nice restaurant",
          startTime: "19:00",
          endTime: "21:00",
          location: "Downtown Restaurant",
          locationUrl: "https://maps.example.com/dinner",
          googlePlaceId: "test-dinner-place",
          googlePlaceDisplayName: "Downtown Restaurant",
          googleMapsUrl:
            "https://www.google.com/maps/place/?q=place_id:test-dinner-place",
          googleFormattedAddress: "456 Dinner Ave, Test City",
          googleLat: 48.8566,
          googleLng: 2.3522,
          estimatedCostInCents: 8000,
        },
      });

      expect(res.status).toBe(201);

      const day1 = body.days.find((d: { id: string }) => d.id === seed.day1Id);
      expect(day1.activities).toHaveLength(3);

      // Activities should be sorted by orderIndex
      expect(day1.activities[0].orderIndex).toBe(0);
      expect(day1.activities[1].orderIndex).toBe(1);
      expect(day1.activities[2].orderIndex).toBe(2);
      expect(day1.activities[2].title).toBe("Evening Dinner");
      expect(day1.activities[2].estimatedCostInCents).toBe(8000);
      expect(day1.activities[2].googlePlaceId).toBe("test-dinner-place");
      expect(day1.activities[2].googlePlaceImageUrl).toBe(
        "https://images.example.com/test-dinner-place.jpg",
      );
    });

    it("returns 404 for non-existent day", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/nonexistent_day/activities`,
        userId: seed.primaryUserId,
        body: {
          orderIndex: 0,
          title: "Test Activity",
        },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Day not found",
      });
    });

    it("validates time format", async () => {
      const { res } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities`,
        userId: seed.primaryUserId,
        body: {
          orderIndex: 2,
          title: "Invalid Time Activity",
          startTime: "9:00", // Should be "09:00"
        },
      });

      // Should reject invalid time format
      expect([400, 422]).toContain(res.status);
    });
  });

  describe("PATCH /api/trips/:id/itinerary/days/:dayId/activities/:activityId", () => {
    it("updates activity fields", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity1Id}`,
        userId: seed.primaryUserId,
        body: {
          title: "Updated Morning Coffee",
          description: "With breakfast",
          startTime: "07:30",
          endTime: "08:30",
          googlePlaceId: "test-cafe-place",
          googlePlaceDisplayName: "Hotel Cafe",
          googleMapsUrl:
            "https://www.google.com/maps/place/?q=place_id:test-cafe-place",
          googleFormattedAddress: "789 Cafe Rd, Test City",
          googleLat: 41.9028,
          googleLng: 12.4964,
          estimatedCostInCents: 2000,
        },
      });

      expect(res.status).toBe(200);

      const day1 = body.days.find((d: { id: string }) => d.id === seed.day1Id);
      const activity = day1.activities.find(
        (a: { id: string }) => a.id === seed.activity1Id,
      );

      expect(activity.title).toBe("Updated Morning Coffee");
      expect(activity.description).toBe("With breakfast");
      expect(activity.startTime).toBe("07:30");
      expect(activity.endTime).toBe("08:30");
      expect(activity.estimatedCostInCents).toBe(2000);
      expect(activity.googlePlaceId).toBe("test-cafe-place");
      expect(activity.googleLng).toBe(12.4964);
      expect(activity.googlePlaceImageUrl).toBe(
        "https://images.example.com/test-cafe-place.jpg",
      );
    });

    it("can update orderIndex to reorder activities", async () => {
      // Move activity1 (orderIndex 0) to orderIndex 2
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity1Id}`,
        userId: seed.primaryUserId,
        body: {
          orderIndex: 2,
        },
      });

      expect(res.status).toBe(200);

      const day1 = body.days.find((d: { id: string }) => d.id === seed.day1Id);
      const activity = day1.activities.find(
        (a: { id: string }) => a.id === seed.activity1Id,
      );
      expect(activity.orderIndex).toBe(2);
    });

    it("can set optional fields to null", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity1Id}`,
        userId: seed.primaryUserId,
        body: {
          description: null,
          startTime: null,
          endTime: null,
          location: null,
          locationUrl: null,
          googlePlaceId: null,
          googlePlaceDisplayName: null,
          googleMapsUrl: null,
          googleFormattedAddress: null,
          googleLat: null,
          googleLng: null,
          estimatedCostInCents: null,
        },
      });

      expect(res.status).toBe(200);

      const day1 = body.days.find((d: { id: string }) => d.id === seed.day1Id);
      const activity = day1.activities.find(
        (a: { id: string }) => a.id === seed.activity1Id,
      );

      expect(activity.description).toBeNull();
      expect(activity.startTime).toBeNull();
      expect(activity.endTime).toBeNull();
      expect(activity.location).toBeNull();
      expect(activity.locationUrl).toBeNull();
      expect(activity.googlePlaceId).toBeNull();
      expect(activity.googleMapsUrl).toBeNull();
      expect(activity.googleLat).toBeNull();
      expect(activity.googleLng).toBeNull();
      expect(activity.googlePlaceImageUrl).toBeNull();
      expect(activity.estimatedCostInCents).toBeNull();
    });

    it("returns 404 for non-existent activity", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/nonexistent_activity`,
        userId: seed.primaryUserId,
        body: { title: "Test" },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Activity not found",
      });
    });

    it("returns 404 when activity belongs to different day", async () => {
      // Try to update activity3 (which belongs to day2) via day1's path
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity3Id}`,
        userId: seed.primaryUserId,
        body: { title: "Test" },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Activity not found",
      });
    });
  });

  describe("DELETE /api/trips/:id/itinerary/days/:dayId/activities/:activityId", () => {
    it("deletes activity and reorders remaining", async () => {
      // Delete activity1 (orderIndex 0)
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity1Id}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);

      const day1 = body.days.find((d: { id: string }) => d.id === seed.day1Id);
      expect(day1.activities).toHaveLength(1);

      // activity2 should now have orderIndex 0
      expect(day1.activities[0].id).toBe(seed.activity2Id);
      expect(day1.activities[0].orderIndex).toBe(0);

      // Verify deleted in DB
      const activityRows = await db
        .select()
        .from(itineraryActivity)
        .where(eq(itineraryActivity.id, seed.activity1Id));
      expect(activityRows).toHaveLength(0);
    });

    it("returns 404 for non-existent activity", async () => {
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/nonexistent_activity`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Activity not found",
      });
    });

    it("returns 404 when activity belongs to different day", async () => {
      // Try to delete activity3 (which belongs to day2) via day1's path
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.tripWithItineraryId}/itinerary/days/${seed.day1Id}/activities/${seed.activity3Id}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "NotFound",
        message: "Activity not found",
      });

      // Verify activity3 was not deleted
      const activityRows = await db
        .select()
        .from(itineraryActivity)
        .where(eq(itineraryActivity.id, seed.activity3Id));
      expect(activityRows).toHaveLength(1);
    });
  });
});
