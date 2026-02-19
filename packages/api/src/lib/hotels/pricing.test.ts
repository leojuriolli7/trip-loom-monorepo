import { describe, expect, it } from "vitest";
import { generatePricePerNight, getPriceBounds } from "./pricing";
import type { PriceRange } from "../../enums";

describe("Hotel Pricing", () => {
  describe("generatePricePerNight", () => {
    const PRICE_RANGES: Array<{
      range: PriceRange;
      min: number;
      max: number;
    }> = [
      { range: "budget", min: 4000, max: 8000 },
      { range: "moderate", min: 10000, max: 18000 },
      { range: "upscale", min: 20000, max: 35000 },
      { range: "luxury", min: 40000, max: 100000 },
    ];

    for (const { range, min, max } of PRICE_RANGES) {
      it(`generates price within ${range} bounds ($${min / 100}-$${max / 100})`, () => {
        // Run multiple times to test randomness stays within bounds
        for (let i = 0; i < 50; i++) {
          const price = generatePricePerNight(range);
          expect(price).toBeGreaterThanOrEqual(min);
          expect(price).toBeLessThanOrEqual(max);
        }
      });
    }

    it("rounds prices to nearest 100 cents ($1)", () => {
      for (let i = 0; i < 50; i++) {
        const price = generatePricePerNight("moderate");
        expect(price % 100).toBe(0);
      }
    });

    it("defaults to moderate range when priceRange is null", () => {
      const moderateBounds = getPriceBounds("moderate");
      for (let i = 0; i < 20; i++) {
        const price = generatePricePerNight(null);
        expect(price).toBeGreaterThanOrEqual(moderateBounds.min);
        expect(price).toBeLessThanOrEqual(moderateBounds.max);
      }
    });

    it("defaults to moderate range when priceRange is undefined", () => {
      const moderateBounds = getPriceBounds("moderate");
      for (let i = 0; i < 20; i++) {
        const price = generatePricePerNight(undefined);
        expect(price).toBeGreaterThanOrEqual(moderateBounds.min);
        expect(price).toBeLessThanOrEqual(moderateBounds.max);
      }
    });

    it("generates different prices (randomness check)", () => {
      const prices = new Set<number>();
      for (let i = 0; i < 100; i++) {
        prices.add(generatePricePerNight("moderate"));
      }
      // With 100 iterations and 80 possible values ($100-$180 in $1 increments),
      // we should see at least a few different prices
      expect(prices.size).toBeGreaterThan(1);
    });
  });

  describe("getPriceBounds", () => {
    it("returns correct bounds for each price range", () => {
      expect(getPriceBounds("budget")).toEqual({ min: 4000, max: 8000 });
      expect(getPriceBounds("moderate")).toEqual({ min: 10000, max: 18000 });
      expect(getPriceBounds("upscale")).toEqual({ min: 20000, max: 35000 });
      expect(getPriceBounds("luxury")).toEqual({ min: 40000, max: 100000 });
    });

    it("defaults to moderate bounds when priceRange is null", () => {
      expect(getPriceBounds(null)).toEqual({ min: 10000, max: 18000 });
    });

    it("defaults to moderate bounds when priceRange is undefined", () => {
      expect(getPriceBounds(undefined)).toEqual({ min: 10000, max: 18000 });
    });
  });
});
