import type { FlightSeatMap } from "@trip-loom/api/dto";

export type PriceTier = "cheap" | "medium" | "expensive";

export interface PriceStats {
  avg: number;
  min: number;
  max: number;
}

export function calculatePriceTiers(seatMap: FlightSeatMap): PriceStats {
  const prices: number[] = [];
  seatMap.forEach((row) => {
    row.sections.forEach((section) => {
      section.forEach((seat) => {
        if (!seat.isBooked) {
          prices.push(seat.priceInCents);
        }
      });
    });
  });

  if (prices.length === 0) return { avg: 0, min: 0, max: 0 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  return { avg, min, max };
}

export function getPriceTier(price: number, stats: PriceStats): PriceTier {
  const range = stats.max - stats.min;
  if (range === 0) return "medium";

  const lowerThreshold = stats.min + range * 0.33;
  const upperThreshold = stats.min + range * 0.66;

  if (price <= lowerThreshold) return "cheap";
  if (price >= upperThreshold) return "expensive";
  return "medium";
}

export const priceTierColors: Record<PriceTier, string> = {
  cheap: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  expensive: "text-rose-600 dark:text-rose-400",
};
