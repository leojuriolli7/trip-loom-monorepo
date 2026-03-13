import { afterAll, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { db } from "../db";
import { user } from "../db/schema";
import { NotFoundError } from "../errors";
import { googleMapsProvider } from "../lib/google-maps/provider";
import { googleMapsRoutes } from "../routes/google-maps";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
} from "./harness";

const ctx = createTestContext("google-maps");
const app = createTestApp().use(googleMapsRoutes);
const request = createJsonRequester(app);
const authMock = createHeaderAuthMock(ctx.prefix);

const searchPlacesSpy = spyOn(googleMapsProvider, "searchPlaces");
const getPlaceDetailsSpy = spyOn(googleMapsProvider, "getPlaceDetails");

const testUserId = `${ctx.prefix}user_maps`;

describe("Google Maps API", () => {
  beforeAll(async () => {
    authMock.enable();
    await ctx.cleanup();
    await db.insert(user).values({
      id: testUserId,
      name: "Maps Test User",
      email: `${testUserId}@example.test`,
      emailVerified: true,
    });
  });

  afterAll(async () => {
    authMock.restore();
    searchPlacesSpy.mockRestore();
    getPlaceDetailsSpy.mockRestore();
    await ctx.cleanup();
  });

  beforeEach(() => {
    searchPlacesSpy.mockReset();
    getPlaceDetailsSpy.mockReset();
  });

  it("searches places with destination bias", async () => {
    searchPlacesSpy.mockResolvedValue([
      {
        placeId: "test-place-id",
        displayName: "Sagrada Familia",
        formattedAddress: "C/ de Mallorca, 401, Barcelona, Spain",
        mapsUrl: "https://www.google.com/maps/place/?q=place_id:test-place-id",
        lat: 41.4036,
        lng: 2.1744,
      },
    ]);

    const { res, body } = await request.get(
      "/api/maps/places/search?query=Sagrada+Familia&destination=Barcelona&pageSize=3",
      testUserId,
    );

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]?.placeId).toBe("test-place-id");
    expect(searchPlacesSpy).toHaveBeenCalledWith({
      query: "Sagrada Familia",
      destination: "Barcelona",
      pageSize: 3,
      latitude: undefined,
      longitude: undefined,
      radiusMeters: undefined,
      languageCode: undefined,
      regionCode: undefined,
    });
  });

  it("gets place details by place id", async () => {
    getPlaceDetailsSpy.mockResolvedValue({
      placeId: "test-place-id",
      displayName: "Park Guell",
      formattedAddress: "08024 Barcelona, Spain",
      mapsUrl: "https://www.google.com/maps/place/?q=place_id:test-place-id",
      lat: 41.4145,
      lng: 2.1527,
      primaryType: "tourist_attraction",
    });

    const { res, body } = await request.get(
      "/api/maps/places/test-place-id?languageCode=en&regionCode=es",
      testUserId,
    );

    expect(res.status).toBe(200);
    expect(body.placeId).toBe("test-place-id");
    expect(body.primaryType).toBe("tourist_attraction");
    expect(getPlaceDetailsSpy).toHaveBeenCalledWith({
      placeId: "test-place-id",
      languageCode: "en",
      regionCode: "es",
    });
  });

  it("returns 404 when place details are not found", async () => {
    getPlaceDetailsSpy.mockRejectedValueOnce(
      new NotFoundError("Google Maps place not found for ID missing-place"),
    );

    const { res, body } = await request.get(
      "/api/maps/places/missing-place",
      testUserId,
    );

    expect(res.status).toBe(404);
    expect(body.message).toContain("missing-place");
  });
});
