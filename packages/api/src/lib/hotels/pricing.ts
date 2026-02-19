import type { PriceRange } from "../../enums";

/**
 * Price bounds per hotel price range in cents.
 * Each range has min/max bounds to ensure realistic pricing variation.
 */
const PRICE_BOUNDS: Record<PriceRange, { min: number; max: number }> = {
  budget: { min: 4000, max: 8000 }, // $40 - $80 per night
  moderate: { min: 10000, max: 18000 }, // $100 - $180 per night
  upscale: { min: 20000, max: 35000 }, // $200 - $350 per night
  luxury: { min: 40000, max: 100000 }, // $400 - $1000 per night
};

/**
 * Default price range when hotel has no priceRange set.
 */
const DEFAULT_PRICE_RANGE: PriceRange = "moderate";

/**
 * Generates a random price per night in cents based on hotel's price range.
 *
 * The price is randomized within the bounds for the given price range,
 * ensuring realistic variation between different bookings for the same hotel.
 *
 * @param priceRange - The hotel's price range category (budget, moderate, upscale, luxury)
 * @returns Price per night in cents
 */
export function generatePricePerNight(
  priceRange: PriceRange | null | undefined,
): number {
  const range = priceRange ?? DEFAULT_PRICE_RANGE;
  const bounds = PRICE_BOUNDS[range];

  // Generate random price within bounds, rounded to nearest 100 cents ($1)
  const rawPrice =
    Math.random() * (bounds.max - bounds.min) + bounds.min;
  return Math.round(rawPrice / 100) * 100;
}

/**
 * Gets the price bounds for a given price range.
 * Useful for UI display of expected price ranges.
 */
export function getPriceBounds(
  priceRange: PriceRange | null | undefined,
): { min: number; max: number } {
  const range = priceRange ?? DEFAULT_PRICE_RANGE;
  return PRICE_BOUNDS[range];
}
