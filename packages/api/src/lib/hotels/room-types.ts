import type { HotelRoomType } from "@trip-loom/contracts/enums";

/**
 * Price multiplier per room type, applied on top of the base price
 * generated from the hotel's priceRange.
 */
export const ROOM_TYPE_MULTIPLIERS: Record<HotelRoomType, number> = {
  single: 0.8,
  twin: 0.9,
  double: 0.95,
  standard: 1.0,
  queen: 1.1,
  king: 1.2,
  family: 1.3,
  deluxe: 1.5,
  "junior-suite": 1.8,
  suite: 2.0,
  penthouse: 3.0,
  villa: 3.5,
};
