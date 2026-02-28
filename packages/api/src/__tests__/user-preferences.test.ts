import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { db } from "../db";
import { user, userPreference } from "../db/schema";
import { generateId } from "../lib/nanoid";
import { userPreferenceRoutes } from "../routes/user-preferences";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
} from "./harness";

const ctx = createTestContext("user_pref");
const primaryUserId = `${ctx.prefix}user_${generateId()}`;
const secondaryUserId = `${ctx.prefix}user_${generateId()}`;

const app = createTestApp().use(userPreferenceRoutes);
const request = createJsonRequester(app);
const authMock = createHeaderAuthMock(ctx.prefix);

describe("User Preferences API", () => {
  beforeAll(async () => {
    authMock.enable();
    await ctx.cleanup();

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
  });

  beforeEach(async () => {
    await db
      .delete(userPreference)
      .where(eq(userPreference.userId, primaryUserId));
    await db
      .delete(userPreference)
      .where(eq(userPreference.userId, secondaryUserId));
  });

  afterAll(async () => {
    await ctx.cleanup();
    authMock.restore();
  });

  it("GET /api/user/preferences returns 401 without auth", async () => {
    const { res, body } = await request.get("/api/user/preferences");

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(body.message).toBe("Authentication required");
  });

  it("GET /api/user/preferences creates defaults for a new user", async () => {
    const first = await request.get("/api/user/preferences", primaryUserId);
    const second = await request.get("/api/user/preferences", primaryUserId);

    expect(first.res.status).toBe(200);
    expect(first.body.userId).toBe(primaryUserId);
    expect(first.body.preferredCabinClass).toBeNull();
    expect(first.body.budgetRange).toBeNull();
    expect(first.body.travelInterests).toEqual([]);
    expect(first.body.preferredRegions).toEqual([]);
    expect(first.body.dietaryRestrictions).toEqual([]);
    expect(first.body.accessibilityNeeds).toBeNull();

    expect(second.res.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    const rows = await db
      .select()
      .from(userPreference)
      .where(eq(userPreference.userId, primaryUserId));
    expect(rows).toHaveLength(1);
  });

  it("GET /api/user/preferences returns saved preferences", async () => {
    await request.put(
      "/api/user/preferences",
      {
        preferredCabinClass: "business",
        budgetRange: "upscale",
        travelInterests: ["food", "culture"],
        preferredRegions: ["Europe", "East Asia"],
        dietaryRestrictions: ["vegetarian"],
        accessibilityNeeds: "wheelchair-accessible hotel",
      },
      primaryUserId,
    );

    const { res, body } = await request.get("/api/user/preferences", primaryUserId);

    expect(res.status).toBe(200);
    expect(body.preferredCabinClass).toBe("business");
    expect(body.budgetRange).toBe("upscale");
    expect(body.travelInterests).toEqual(["food", "culture"]);
    expect(body.preferredRegions).toEqual(["Europe", "East Asia"]);
    expect(body.dietaryRestrictions).toEqual(["vegetarian"]);
    expect(body.accessibilityNeeds).toBe("wheelchair-accessible hotel");
  });

  it("PUT /api/user/preferences returns 401 without auth", async () => {
    const { res, body } = await request.put("/api/user/preferences", {
      budgetRange: "moderate",
    });

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("PUT /api/user/preferences creates new preferences", async () => {
    const { res, body } = await request.put(
      "/api/user/preferences",
      {
        preferredCabinClass: "economy",
        budgetRange: "budget",
        travelInterests: ["beaches", "nature"],
        preferredRegions: ["Southeast Asia"],
      },
      secondaryUserId,
    );

    expect(res.status).toBe(200);
    expect(body.userId).toBe(secondaryUserId);
    expect(body.preferredCabinClass).toBe("economy");
    expect(body.budgetRange).toBe("budget");
    expect(body.travelInterests).toEqual(["beaches", "nature"]);
    expect(body.preferredRegions).toEqual(["Southeast Asia"]);
    expect(body.dietaryRestrictions).toEqual([]);
    expect(body.accessibilityNeeds).toBeNull();
  });

  it("PUT /api/user/preferences updates existing preferences", async () => {
    const first = await request.put(
      "/api/user/preferences",
      {
        preferredCabinClass: "economy",
        budgetRange: "moderate",
        travelInterests: ["adventure"],
      },
      primaryUserId,
    );

    const second = await request.put(
      "/api/user/preferences",
      {
        preferredCabinClass: "first",
        budgetRange: "luxury",
        travelInterests: ["art", "wine"],
      },
      primaryUserId,
    );

    expect(first.res.status).toBe(200);
    expect(second.res.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.preferredCabinClass).toBe("first");
    expect(second.body.budgetRange).toBe("luxury");
    expect(second.body.travelInterests).toEqual(["art", "wine"]);
  });

  it("PUT /api/user/preferences validates input schema", async () => {
    const { res } = await request.put(
      "/api/user/preferences",
      {
        preferredCabinClass: "premium",
        preferredRegions: ["Moon"],
      },
      primaryUserId,
    );

    expect([400, 422]).toContain(res.status);
  });

  it("PUT /api/user/preferences supports partial updates", async () => {
    const first = await request.put(
      "/api/user/preferences",
      {
        preferredCabinClass: "business",
        budgetRange: "upscale",
        travelInterests: ["food"],
        preferredRegions: ["Europe"],
        dietaryRestrictions: ["vegan"],
      },
      primaryUserId,
    );

    const second = await request.put(
      "/api/user/preferences",
      {
        budgetRange: "luxury",
      },
      primaryUserId,
    );

    expect(first.res.status).toBe(200);
    expect(second.res.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.preferredCabinClass).toBe("business");
    expect(second.body.budgetRange).toBe("luxury");
    expect(second.body.travelInterests).toEqual(["food"]);
    expect(second.body.preferredRegions).toEqual(["Europe"]);
    expect(second.body.dietaryRestrictions).toEqual(["vegan"]);
  });
});
