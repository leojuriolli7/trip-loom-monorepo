import type { DB_NewDestination, DB_NewHotel } from "../../db/types";
import { generateId } from "../../lib/nanoid";

/**
 * Creates test destinations for a given test context.
 * All destinations share the same region for easy filtering/isolation.
 *
 * @param prefix - The test context prefix (e.g., "dest_test_")
 * @param region - Unique region for this test suite
 */
export function createTestDestinations(
  prefix: string,
  region: string,
): DB_NewDestination[] {
  return [
    {
      id: `${prefix}${generateId()}`,
      name: "TestTokyo",
      country: "Japan",
      countryCode: "JP",
      region,
      timezone: "Asia/Tokyo",
      imageUrl: null,
      description: "A vibrant metropolis blending tradition and modernity.",
      highlights: ["culture", "food", "temples"],
      bestTimeToVisit: "March to May",
    },
    {
      id: `${prefix}${generateId()}`,
      name: "TestParis",
      country: "France",
      countryCode: "FR",
      region,
      timezone: "Europe/Paris",
      imageUrl: null,
      description: "The City of Light, known for art and romance.",
      highlights: ["art", "culture", "food"],
      bestTimeToVisit: "April to June",
    },
    {
      id: `${prefix}${generateId()}`,
      name: "TestBali",
      country: "Indonesia",
      countryCode: "ID",
      region,
      timezone: "Asia/Makassar",
      imageUrl: null,
      description: "Tropical paradise with beaches and temples.",
      highlights: ["beaches", "temples", "relaxation"],
      bestTimeToVisit: "April to October",
    },
  ];
}

/**
 * Creates test hotels for the first destination (Tokyo).
 * Includes a variety of price ranges and star ratings for filter testing.
 *
 * @param prefix - The test context prefix
 * @param tokyoId - The ID of the Tokyo destination
 */
export function createTestHotelsForTokyo(
  prefix: string,
  tokyoId: string,
): DB_NewHotel[] {
  return [
    {
      id: `${prefix}hotel_${generateId()}`,
      destinationId: tokyoId,
      name: "Hotel Sakura",
      address: "1-1-1 Shibuya, Tokyo",
      latitude: 35.6762,
      longitude: 139.6503,
      imageUrl: null,
      starRating: 4,
      amenities: ["wifi", "restaurant", "gym"],
      priceRange: "upscale",
      avgPricePerNightInCents: 25000,
      description: "Modern hotel in the heart of Shibuya.",
    },
    {
      id: `${prefix}hotel_${generateId()}`,
      destinationId: tokyoId,
      name: "Budget Inn Tokyo",
      address: "2-2-2 Shinjuku, Tokyo",
      latitude: 35.6895,
      longitude: 139.6917,
      imageUrl: null,
      starRating: 2,
      amenities: ["wifi", "air-conditioning"],
      priceRange: "budget",
      avgPricePerNightInCents: 8000,
      description: "Affordable stay in Shinjuku.",
    },
  ];
}

/**
 * Creates a comprehensive set of test hotels across multiple destinations.
 * Used for hotel-focused tests that need variety.
 *
 * @param prefix - The test context prefix
 * @param destinations - Array of destination IDs [tokyoId, parisId, ...]
 */
export function createTestHotels(
  prefix: string,
  destinations: DB_NewDestination[],
): DB_NewHotel[] {
  const [tokyo, paris] = destinations;

  return [
    {
      id: `${prefix}${generateId()}`,
      destinationId: tokyo.id,
      name: "Hotel Sakura",
      address: "1-1-1 Shibuya, Tokyo",
      latitude: 35.6762,
      longitude: 139.6503,
      imageUrl: null,
      starRating: 4,
      amenities: ["wifi", "restaurant", "gym"],
      priceRange: "upscale",
      avgPricePerNightInCents: 25000,
      description: "Modern hotel in the heart of Shibuya.",
    },
    {
      id: `${prefix}${generateId()}`,
      destinationId: tokyo.id,
      name: "Budget Inn Tokyo",
      address: "2-2-2 Shinjuku, Tokyo",
      latitude: 35.6895,
      longitude: 139.6917,
      imageUrl: null,
      starRating: 2,
      amenities: ["wifi", "air-conditioning"],
      priceRange: "budget",
      avgPricePerNightInCents: 8000,
      description: "Affordable stay in Shinjuku.",
    },
    {
      id: `${prefix}${generateId()}`,
      destinationId: tokyo.id,
      name: "Luxury Palace Tokyo",
      address: "3-3-3 Ginza, Tokyo",
      latitude: 35.6717,
      longitude: 139.7649,
      imageUrl: null,
      starRating: 5,
      amenities: ["wifi", "spa", "pool", "restaurant", "gym"],
      priceRange: "luxury",
      avgPricePerNightInCents: 80000,
      description: "Five-star luxury in Ginza.",
    },
    {
      id: `${prefix}${generateId()}`,
      destinationId: paris.id,
      name: "Le Petit Paris",
      address: "10 Rue de Rivoli, Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      imageUrl: null,
      starRating: 3,
      amenities: ["wifi", "restaurant"],
      priceRange: "moderate",
      avgPricePerNightInCents: 15000,
      description: "Charming hotel near the Louvre.",
    },
  ];
}
