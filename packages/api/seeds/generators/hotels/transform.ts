/// <reference types="node" />
/**
 * Transform raw TripAdvisor hotel data to our schema format.
 *
 * Usage:
 *   npx tsx scripts/generate-seed-data/hotels/transform.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Our enum values from schema
const AMENITY_VALUES = [
  "wifi",
  "free-wifi",
  "pool",
  "indoor-pool",
  "outdoor-pool",
  "heated-pool",
  "infinity-pool",
  "rooftop-pool",
  "spa",
  "sauna",
  "steam-room",
  "hot-tub",
  "gym",
  "fitness-center",
  "restaurant",
  "bar",
  "rooftop-bar",
  "coffee-shop",
  "parking",
  "free-parking",
  "valet-parking",
  "airport-shuttle",
  "free-airport-transportation",
  "room-service",
  "concierge",
  "beach-access",
  "beachfront",
  "private-beach",
  "pet-friendly",
  "business-center",
  "meeting-rooms",
  "conference-facilities",
  "kids-club",
  "kids-pool",
  "laundry",
  "dry-cleaning",
  "air-conditioning",
  "balcony",
  "private-balcony",
  "ocean-view",
  "city-view",
  "mountain-view",
  "24-hour-front-desk",
  "24-hour-security",
  "accessible-rooms",
  "wheelchair-access",
  "all-inclusive",
  "babysitting",
  "baggage-storage",
  "bathrobes",
  "breakfast-included",
  "breakfast-buffet",
  "casino",
  "currency-exchange",
  "doorperson",
  "electric-vehicle-charging",
  "executive-lounge",
  "express-check-in",
  "family-rooms",
  "fireplace",
  "gift-shop",
  "golf-course",
  "hair-dryer",
  "housekeeping",
  "kitchenette",
  "minibar",
  "non-smoking-rooms",
  "non-smoking-hotel",
  "on-demand-movies",
  "outdoor-furniture",
  "patio",
  "private-bathroom",
  "refrigerator",
  "safe",
  "shuttle-service",
  "soundproof-rooms",
  "suites",
  "sun-terrace",
  "tennis-court",
  "tv",
  "flatscreen-tv",
  "bicycle-rental",
  "diving",
  "snorkeling",
  "water-sports",
  "hiking",
  "yoga-classes",
  "massage",
  "couples-massage",
  "poolside-bar",
  "snack-bar",
  "special-diet-menus",
  "telephone",
  "iron",
] as const;

const STYLE_VALUES = [
  "art-deco",
  "bay-view",
  "boutique",
  "budget",
  "business",
  "centrally-located",
  "charming",
  "city-view",
  "classic",
  "family",
  "family-resort",
  "great-view",
  "green",
  "harbor-view",
  "hidden-gem",
  "historic",
  "lagoon-view",
  "lake-view",
  "luxury",
  "marina-view",
  "mid-range",
  "modern",
  "mountain-view",
  "ocean-view",
  "park-view",
  "quaint",
  "quiet",
  "quirky",
  "residential",
  "river-view",
  "romantic",
  "trendy",
  "value",
] as const;

type Amenity = (typeof AMENITY_VALUES)[number];
type HotelStyle = (typeof STYLE_VALUES)[number];

// Mapping from TripAdvisor amenity names to our enum values
const AMENITY_MAPPING: Record<string, Amenity> = {
  // Wifi
  Wifi: "wifi",
  "Free Wifi": "free-wifi",
  "Public Wifi": "wifi",
  Internet: "wifi",
  "Free Internet": "free-wifi",

  // Pool
  Pool: "pool",
  "Indoor pool": "indoor-pool",
  "Outdoor pool": "outdoor-pool",
  "Heated pool": "heated-pool",
  "Infinity Pool": "infinity-pool",
  "Rooftop Pool": "rooftop-pool",
  "Kids pool": "kids-pool",

  // Spa & Wellness
  Spa: "spa",
  Sauna: "sauna",
  "Steam Room": "steam-room",
  "Hot Tub": "hot-tub",
  Massage: "massage",
  "Couples Massage": "couples-massage",
  "Yoga Classes": "yoga-classes",

  // Fitness
  "Fitness center": "fitness-center",
  "Fitness Classes": "gym",

  // Dining
  Restaurant: "restaurant",
  "Bar/Lounge": "bar",
  "Rooftop Bar": "rooftop-bar",
  "Coffee Shop": "coffee-shop",
  "Poolside Bar": "poolside-bar",
  "Snack Bar": "snack-bar",
  "Room service": "room-service",
  "Special Diet Menus": "special-diet-menus",

  // Parking
  Parking: "parking",
  "Free parking": "free-parking",
  "Valet Parking": "valet-parking",

  // Transportation
  "Airport transportation": "airport-shuttle",
  "Free airport transportation": "free-airport-transportation",
  "Shuttle Bus Service": "shuttle-service",
  "Free Shuttle or Taxi Services": "shuttle-service",

  // Services
  Concierge: "concierge",
  "24-Hour Front Desk": "24-hour-front-desk",
  "24-Hour Security": "24-hour-security",
  Housekeeping: "housekeeping",
  "Laundry Service": "laundry",
  "Dry Cleaning": "dry-cleaning",
  Babysitting: "babysitting",
  "Baggage Storage": "baggage-storage",
  "Currency Exchange": "currency-exchange",
  Doorperson: "doorperson",
  "Express Check-in / Check-out": "express-check-in",
  "Gift Shop": "gift-shop",

  // Beach
  "Beach Access": "beach-access",
  Beachfront: "beachfront",
  "Private Beaches": "private-beach",

  // Business
  "Business center": "business-center",
  "Meeting rooms": "meeting-rooms",
  "Conference Facilities": "conference-facilities",

  // Family
  "Kids Club": "kids-club",
  "Family Rooms": "family-rooms",

  // Room amenities
  "Air conditioning": "air-conditioning",
  "Private Balcony": "private-balcony",
  "Ocean View": "ocean-view",
  "City View": "city-view",
  "Mountain View": "mountain-view",
  Bathrobes: "bathrobes",
  Kitchenette: "kitchenette",
  Minibar: "minibar",
  "Refrigerator in room": "refrigerator",
  Safe: "safe",
  "Soundproof Rooms": "soundproof-rooms",
  Suites: "suites",
  "Hair Dryer": "hair-dryer",
  Iron: "iron",
  Telephone: "telephone",
  "Flatscreen TV": "flatscreen-tv",
  "Cable / Satellite TV": "tv",
  Fireplace: "fireplace",
  Patio: "patio",
  "Private Bathrooms": "private-bathroom",
  "Outdoor Furniture": "outdoor-furniture",
  "Sun Terrace": "sun-terrace",
  "On-Demand Movies": "on-demand-movies",

  // Accessibility
  "Accessible rooms": "accessible-rooms",
  "Wheelchair access": "wheelchair-access",
  "Facilities for Disabled Guests": "accessible-rooms",

  // Policies
  "Non-smoking rooms": "non-smoking-rooms",
  "Non-smoking hotel": "non-smoking-hotel",
  "Pets Allowed": "pet-friendly",
  "All-Inclusive": "all-inclusive",
  "Breakfast included": "breakfast-included",
  "Breakfast Buffet": "breakfast-buffet",

  // Activities
  "Golf course": "golf-course",
  "Tennis Court": "tennis-court",
  "Bicycle Rental": "bicycle-rental",
  Diving: "diving",
  Snorkeling: "snorkeling",
  Hiking: "hiking",
  "Water Sport Equipment Rentals": "water-sports",

  // Other
  Casino: "casino",
  "Electric vehicle charging station": "electric-vehicle-charging",
  "Executive Lounge Access": "executive-lounge",
};

// Mapping from TripAdvisor style names to our enum values
const STYLE_MAPPING: Record<string, HotelStyle> = {
  "Art Deco Style": "art-deco",
  "Bay View": "bay-view",
  Boutique: "boutique",
  Budget: "budget",
  Business: "business",
  "Centrally Located": "centrally-located",
  Charming: "charming",
  "City View": "city-view",
  Classic: "classic",
  Family: "family",
  "Family Resort": "family-resort",
  "Great View": "great-view",
  Green: "green",
  "Harbor View": "harbor-view",
  "Hidden Gem": "hidden-gem",
  "Historic Hotel": "historic",
  "Lagoon View": "lagoon-view",
  "Lake View": "lake-view",
  Luxury: "luxury",
  "Marina View": "marina-view",
  "Mid-range": "mid-range",
  Modern: "modern",
  "Mountain View": "mountain-view",
  "Ocean View": "ocean-view",
  "Park View": "park-view",
  Quaint: "quaint",
  Quiet: "quiet",
  "Quirky Hotels": "quirky",
  "Residential Neighborhood": "residential",
  "River View": "river-view",
  Romantic: "romantic",
  Trendy: "trendy",
  Value: "value",
};

type RawHotelDetails = {
  location_id: string;
  name: string;
  description?: string;
  web_url?: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
  latitude?: string;
  longitude?: string;
  rating?: string;
  num_reviews?: string;
  price_level?: string;
  amenities?: string[];
  styles?: string[];
  ranking_data?: {
    ranking_string?: string;
  };
};

type EnrichedHotel = {
  destinationId: string;
  destinationName: string;
  country: string;
  searchResult: {
    location_id: string;
    name: string;
    address_obj?: Record<string, string>;
  };
  details: RawHotelDetails | null;
};

type TransformedHotel = {
  id: string;
  destinationId: string;
  name: string;
  address: string;
  addressObj: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
  } | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  source: string;
  sourceId: string;
  sourceUrl: string | null;
  rating: number | null;
  numReviews: number | null;
  rankingString: string | null;
  starRating: number | null;
  amenities: Amenity[];
  styles: HotelStyle[];
  priceRange: "budget" | "moderate" | "upscale" | "luxury" | null;
  avgPricePerNightInCents: number | null;
  description: string | null;
};

function generateId(name: string, locationId: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `hotel_${locationId}_${slug}`;
}

type PriceInfo = {
  priceRange: "budget" | "moderate" | "upscale" | "luxury" | null;
  avgPricePerNightInCents: number | null;
};

/**
 * Map TripAdvisor price_level to our price range and estimated nightly price.
 * Since TripAdvisor only provides relative price indicators ($ to $$$$),
 * we derive estimated prices based on typical ranges for each tier.
 */
function mapPriceLevel(priceLevel: string | undefined): PriceInfo {
  switch (priceLevel) {
    case "$":
      // Budget: ~$50-100/night, midpoint ~$75
      return { priceRange: "budget", avgPricePerNightInCents: 7500 };
    case "$$":
      // Moderate-low: ~$100-175/night, midpoint ~$135
      return { priceRange: "moderate", avgPricePerNightInCents: 13500 };
    case "$$$":
      // Moderate-high: ~$175-300/night, midpoint ~$235
      return { priceRange: "moderate", avgPricePerNightInCents: 23500 };
    case "$$$$":
      // Upscale/Luxury: ~$300-600/night, midpoint ~$450
      return { priceRange: "upscale", avgPricePerNightInCents: 45000 };
    default:
      // No price info - default to moderate range estimate
      return { priceRange: "moderate", avgPricePerNightInCents: 17500 };
  }
}

function mapAmenities(rawAmenities: string[] | undefined): Amenity[] {
  if (!rawAmenities) return [];
  const mapped = new Set<Amenity>();
  for (const amenity of rawAmenities) {
    const value = AMENITY_MAPPING[amenity];
    if (value) {
      mapped.add(value);
    }
  }
  return Array.from(mapped);
}

function mapStyles(rawStyles: string[] | undefined): HotelStyle[] {
  if (!rawStyles) return [];
  const mapped: HotelStyle[] = [];
  for (const style of rawStyles) {
    const value = STYLE_MAPPING[style];
    if (value) {
      mapped.push(value);
    }
  }
  return mapped;
}

function buildAddress(addressObj: RawHotelDetails["address_obj"]): string {
  if (!addressObj) return "Unknown address";
  if (addressObj.address_string) return addressObj.address_string;

  const parts: string[] = [];
  if (addressObj.street1) parts.push(addressObj.street1);
  if (addressObj.city) parts.push(addressObj.city);
  if (addressObj.state) parts.push(addressObj.state);
  if (addressObj.country) parts.push(addressObj.country);

  return parts.join(", ") || "Unknown address";
}

function transformHotel(raw: EnrichedHotel): TransformedHotel | null {
  const details = raw.details;

  // Skip hotels without details
  if (!details) return null;

  const addressObj = details.address_obj || raw.searchResult.address_obj;
  const priceInfo = mapPriceLevel(details.price_level);

  return {
    id: generateId(details.name, details.location_id),
    destinationId: raw.destinationId,
    name: details.name,
    address: buildAddress(addressObj as RawHotelDetails["address_obj"]),
    addressObj: addressObj
      ? {
          street1: (addressObj as Record<string, string>).street1,
          street2: (addressObj as Record<string, string>).street2,
          city: (addressObj as Record<string, string>).city,
          state: (addressObj as Record<string, string>).state,
          country: (addressObj as Record<string, string>).country,
          postalcode: (addressObj as Record<string, string>).postalcode,
        }
      : null,
    latitude: details.latitude ? parseFloat(details.latitude) : null,
    longitude: details.longitude ? parseFloat(details.longitude) : null,
    imageUrl: null, // TripAdvisor doesn't provide images in the API
    source: "tripadvisor",
    sourceId: details.location_id,
    sourceUrl: details.web_url || null,
    rating: details.rating ? parseFloat(details.rating) : null,
    numReviews: details.num_reviews ? parseInt(details.num_reviews, 10) : null,
    rankingString: details.ranking_data?.ranking_string || null,
    starRating: null, // TripAdvisor doesn't provide star ratings
    amenities: mapAmenities(details.amenities),
    styles: mapStyles(details.styles),
    priceRange: priceInfo.priceRange,
    avgPricePerNightInCents: priceInfo.avgPricePerNightInCents,
    description: details.description || null,
  };
}

async function main() {
  const dataPath = path.join(__dirname, "raw-hotels-details.json");
  const outputPath = path.join(__dirname, "../../data/hotels.json");

  const rawHotels: EnrichedHotel[] = JSON.parse(
    await readFile(dataPath, "utf8")
  );

  console.log(`Transforming ${rawHotels.length} raw hotel records...`);

  const hotels: TransformedHotel[] = [];
  const seenIds = new Set<string>();
  let skipped = 0;
  let duplicates = 0;

  for (const raw of rawHotels) {
    const transformed = transformHotel(raw);

    if (!transformed) {
      skipped++;
      continue;
    }

    // Skip duplicates (same hotel from different searches)
    if (seenIds.has(transformed.sourceId)) {
      duplicates++;
      continue;
    }

    seenIds.add(transformed.sourceId);
    hotels.push(transformed);
  }

  await writeFile(outputPath, JSON.stringify(hotels, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Total raw records: ${rawHotels.length}`);
  console.log(`Transformed: ${hotels.length}`);
  console.log(`Skipped (no details): ${skipped}`);
  console.log(`Duplicates removed: ${duplicates}`);
  console.log(`Output: ${outputPath}`);

  // Stats
  const withRating = hotels.filter((h) => h.rating).length;
  const withAmenities = hotels.filter((h) => h.amenities.length > 0).length;
  const withStyles = hotels.filter((h) => h.styles.length > 0).length;
  const withDescription = hotels.filter((h) => h.description).length;
  const withPriceRange = hotels.filter((h) => h.priceRange).length;

  console.log(`\nWith rating: ${withRating}`);
  console.log(`With amenities: ${withAmenities}`);
  console.log(`With styles: ${withStyles}`);
  console.log(`With description: ${withDescription}`);
  console.log(`With price range: ${withPriceRange}`);

  // Price distribution
  const priceRangeCounts: Record<string, number> = {};
  const priceCents: number[] = [];
  for (const hotel of hotels) {
    if (hotel.priceRange) {
      priceRangeCounts[hotel.priceRange] =
        (priceRangeCounts[hotel.priceRange] || 0) + 1;
    }
    if (hotel.avgPricePerNightInCents) {
      priceCents.push(hotel.avgPricePerNightInCents);
    }
  }

  console.log("\nPrice range distribution:");
  for (const [range, count] of Object.entries(priceRangeCounts).sort()) {
    console.log(`  ${range}: ${count}`);
  }

  if (priceCents.length > 0) {
    const avgPrice = priceCents.reduce((a, b) => a + b, 0) / priceCents.length;
    const minPrice = Math.min(...priceCents);
    const maxPrice = Math.max(...priceCents);
    console.log(
      `\nPrice estimates: min $${(minPrice / 100).toFixed(0)}, avg $${(avgPrice / 100).toFixed(0)}, max $${(maxPrice / 100).toFixed(0)}`
    );
  }

  // Amenity stats
  const amenityCounts: Record<string, number> = {};
  for (const hotel of hotels) {
    for (const amenity of hotel.amenities) {
      amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
    }
  }

  console.log("\nTop amenities:");
  const sortedAmenities = Object.entries(amenityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  for (const [amenity, count] of sortedAmenities) {
    console.log(`  ${amenity}: ${count}`);
  }

  // Style stats
  const styleCounts: Record<string, number> = {};
  for (const hotel of hotels) {
    for (const style of hotel.styles) {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    }
  }

  console.log("\nTop styles:");
  const sortedStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [style, count] of sortedStyles) {
    console.log(`  ${style}: ${count}`);
  }
}

main().catch(console.error);
