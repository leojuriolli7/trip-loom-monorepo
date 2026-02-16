import { Elysia } from "elysia";
import { eq, like } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { db } from "../db";
import { user, userPreference } from "../db/schema";
import { auth } from "../lib/auth";
import { generateId } from "../lib/nanoid";
import { userPreferenceRoutes } from "../routes/user-preferences";
import { createTestContext } from "./utils/test-db";

const ctx = createTestContext("user_pref");
const primaryUserId = `${ctx.prefix}user_${generateId()}`;
const secondaryUserId = `${ctx.prefix}user_${generateId()}`;

const app = new Elysia().use(userPreferenceRoutes);

const authSpy = vi.spyOn(auth.api, "getSession");

const requestJson = async ({
  method,
  path,
  userId,
  body,
}: {
  method: "GET" | "PUT";
  path: string;
  userId?: string;
  body?: unknown;
}) => {
  const headers = new Headers();

  if (userId) {
    headers.set("x-test-user-id", userId);
  }

  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const res = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
  const json = await res.json();

  return { res, body: json };
};

const cleanupUserPreferences = async () => {
  await db
    .delete(userPreference)
    .where(like(userPreference.userId, `${ctx.prefix}%`));
};

const cleanupUsers = async () => {
  await db.delete(user).where(like(user.id, `${ctx.prefix}%`));
};

describe("User Preferences API", () => {
  beforeAll(async () => {
    authSpy.mockImplementation(async (input) => {
      const headers = (input as { headers?: Headers }).headers;
      if (!headers) {
        return null;
      }
      const userId = headers.get("x-test-user-id");
      if (!userId) {
        return null;
      }

      return {
        user: {
          id: userId,
          name: "Test User",
          email: `${userId}@example.test`,
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: `${ctx.prefix}session_${userId}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          token: `${ctx.prefix}token_${userId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
          userId,
        },
      } as Awaited<ReturnType<typeof auth.api.getSession>>;
    });

    await cleanupUserPreferences();
    await cleanupUsers();

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
    await cleanupUserPreferences();
  });

  afterAll(async () => {
    await cleanupUserPreferences();
    await cleanupUsers();
    authSpy.mockRestore();
  });

  it("GET /api/user/preferences returns 401 without auth", async () => {
    const { res, body } = await requestJson({
      method: "GET",
      path: "/api/user/preferences",
    });

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(body.message).toBe("Authentication required");
  });

  it("GET /api/user/preferences creates defaults for a new user", async () => {
    const first = await requestJson({
      method: "GET",
      path: "/api/user/preferences",
      userId: primaryUserId,
    });
    const second = await requestJson({
      method: "GET",
      path: "/api/user/preferences",
      userId: primaryUserId,
    });

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
    await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: primaryUserId,
      body: {
        preferredCabinClass: "business",
        budgetRange: "upscale",
        travelInterests: ["food", "culture"],
        preferredRegions: ["Europe", "East Asia"],
        dietaryRestrictions: ["vegetarian"],
        accessibilityNeeds: "wheelchair-accessible hotel",
      },
    });

    const { res, body } = await requestJson({
      method: "GET",
      path: "/api/user/preferences",
      userId: primaryUserId,
    });

    expect(res.status).toBe(200);
    expect(body.preferredCabinClass).toBe("business");
    expect(body.budgetRange).toBe("upscale");
    expect(body.travelInterests).toEqual(["food", "culture"]);
    expect(body.preferredRegions).toEqual(["Europe", "East Asia"]);
    expect(body.dietaryRestrictions).toEqual(["vegetarian"]);
    expect(body.accessibilityNeeds).toBe("wheelchair-accessible hotel");
  });

  it("PUT /api/user/preferences returns 401 without auth", async () => {
    const { res, body } = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      body: {
        budgetRange: "moderate",
      },
    });

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("PUT /api/user/preferences creates new preferences", async () => {
    const { res, body } = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: secondaryUserId,
      body: {
        preferredCabinClass: "economy",
        budgetRange: "budget",
        travelInterests: ["beaches", "nature"],
        preferredRegions: ["Southeast Asia"],
      },
    });

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
    const first = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: primaryUserId,
      body: {
        preferredCabinClass: "economy",
        budgetRange: "moderate",
        travelInterests: ["adventure"],
      },
    });

    const second = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: primaryUserId,
      body: {
        preferredCabinClass: "first",
        budgetRange: "luxury",
        travelInterests: ["art", "wine"],
      },
    });

    expect(first.res.status).toBe(200);
    expect(second.res.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.preferredCabinClass).toBe("first");
    expect(second.body.budgetRange).toBe("luxury");
    expect(second.body.travelInterests).toEqual(["art", "wine"]);
  });

  it("PUT /api/user/preferences validates input schema", async () => {
    const { res } = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: primaryUserId,
      body: {
        preferredCabinClass: "premium",
        preferredRegions: ["Moon"],
      },
    });

    expect([400, 422]).toContain(res.status);
  });

  it("PUT /api/user/preferences supports partial updates", async () => {
    const first = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: primaryUserId,
      body: {
        preferredCabinClass: "business",
        budgetRange: "upscale",
        travelInterests: ["food"],
        preferredRegions: ["Europe"],
        dietaryRestrictions: ["vegan"],
      },
    });

    const second = await requestJson({
      method: "PUT",
      path: "/api/user/preferences",
      userId: primaryUserId,
      body: {
        budgetRange: "luxury",
      },
    });

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
