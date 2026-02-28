import { describe, expect, it } from "bun:test";
import { generatePricePerNight, getPriceBounds } from "./pricing";
import { ROOM_TYPE_MULTIPLIERS } from "./room-types";
import type { HotelRoomType, PriceRange } from "../../enums";

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
      it(`generates price within ${range} bounds for standard room ($${min / 100}-$${max / 100})`, () => {
        for (let i = 0; i < 50; i++) {
          const price = generatePricePerNight(range, "standard");
          expect(price).toBeGreaterThanOrEqual(min);
          expect(price).toBeLessThanOrEqual(max);
        }
      });
    }

    it("rounds prices to nearest 100 cents ($1)", () => {
      for (let i = 0; i < 50; i++) {
        const price = generatePricePerNight("moderate", "standard");
        expect(price % 100).toBe(0);
      }
    });

    it("defaults to moderate range when priceRange is null", () => {
      const moderateBounds = getPriceBounds("moderate");
      for (let i = 0; i < 20; i++) {
        const price = generatePricePerNight(null, "standard");
        expect(price).toBeGreaterThanOrEqual(moderateBounds.min);
        expect(price).toBeLessThanOrEqual(moderateBounds.max);
      }
    });

    it("defaults to moderate range when priceRange is undefined", () => {
      const moderateBounds = getPriceBounds("moderate");
      for (let i = 0; i < 20; i++) {
        const price = generatePricePerNight(undefined, "standard");
        expect(price).toBeGreaterThanOrEqual(moderateBounds.min);
        expect(price).toBeLessThanOrEqual(moderateBounds.max);
      }
    });

    it("generates different prices (randomness check)", () => {
      const prices = new Set<number>();
      for (let i = 0; i < 100; i++) {
        prices.add(generatePricePerNight("moderate", "standard"));
      }
      expect(prices.size).toBeGreaterThan(1);
    });

    it("applies room type multiplier correctly", () => {
      const roomTypes: HotelRoomType[] = ["single", "suite", "penthouse"];
      for (const roomType of roomTypes) {
        const multiplier = ROOM_TYPE_MULTIPLIERS[roomType];
        const bounds = getPriceBounds("moderate");
        for (let i = 0; i < 20; i++) {
          const price = generatePricePerNight("moderate", roomType);
          // Price should be within bounds * multiplier, rounded to nearest $1
          const minExpected =
            Math.round((bounds.min * multiplier) / 100) * 100 - 100;
          const maxExpected =
            Math.round((bounds.max * multiplier) / 100) * 100 + 100;
          expect(price).toBeGreaterThanOrEqual(minExpected);
          expect(price).toBeLessThanOrEqual(maxExpected);
        }
      }
    });

    it("suite costs more than standard for same price range", () => {
      // With enough samples, average suite price should exceed average standard price
      let standardTotal = 0;
      let suiteTotal = 0;
      const iterations = 200;
      for (let i = 0; i < iterations; i++) {
        standardTotal += generatePricePerNight("moderate", "standard");
        suiteTotal += generatePricePerNight("moderate", "suite");
      }
      expect(suiteTotal / iterations).toBeGreaterThan(
        standardTotal / iterations,
      );
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
