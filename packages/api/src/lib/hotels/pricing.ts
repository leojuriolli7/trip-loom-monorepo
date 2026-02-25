import type { HotelRoomType, PriceRange } from "../../enums";
import { ROOM_TYPE_MULTIPLIERS } from "./room-types";

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
 * Generates a random price per night in cents based on hotel's price range
 * and the selected room type.
 *
 * The base price is randomized within the bounds for the given price range.
 * A room-type multiplier is then applied (e.g., suite = 2x, single = 0.8x).
 *
 * @param priceRange - The hotel's price range category (budget, moderate, upscale, luxury)
 * @param roomType - The selected room type (affects final price via multiplier)
 * @returns Price per night in cents
 */
export function generatePricePerNight(
  priceRange: PriceRange | null | undefined,
  roomType: HotelRoomType,
): number {
  const range = priceRange ?? DEFAULT_PRICE_RANGE;
  const bounds = PRICE_BOUNDS[range];
  const multiplier = ROOM_TYPE_MULTIPLIERS[roomType];

  // Generate random base price within bounds, apply room type multiplier,
  // rounded to nearest 100 cents ($1)
  const rawPrice =
    Math.random() * (bounds.max - bounds.min) + bounds.min;
  return Math.round((rawPrice * multiplier) / 100) * 100;
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
