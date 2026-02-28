/**
 * Analyzes raw hotel data to extract unique values for schema design.
 * Outputs: discovered styles, price levels, and amenity mapping suggestions.
 *
 * Usage:
 *   npx tsx scripts/generate-seed-data/hotels/analyze-data.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type HotelDetails = {
  location_id: string;
  name: string;
  description?: string;
  web_url?: string;
  latitude?: string;
  longitude?: string;
  rating?: string;
  num_reviews?: string;
  price_level?: string;
  amenities?: string[];
  styles?: string[];
  ranking_data?: {
    ranking_string: string;
    ranking: string;
    ranking_out_of: string;
  };
  trip_types?: Array<{
    name: string;
    localized_name: string;
    value: string;
  }>;
  subcategory?: Array<{
    name: string;
    localized_name: string;
  }>;
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
  details: HotelDetails | null;
};

async function main() {
  const dataPath = path.join(__dirname, "raw-hotels-details.json");
  const hotels: EnrichedHotel[] = JSON.parse(await readFile(dataPath, "utf8"));

  console.log(`Analyzing ${hotels.length} hotels...\n`);

  // Collect unique values
  const styles = new Set<string>();
  const priceLevels = new Set<string>();
  const amenities = new Set<string>();
  const tripTypes = new Set<string>();
  const subcategories = new Set<string>();

  // Stats
  let withDetails = 0;
  let withStyles = 0;
  let withPriceLevel = 0;
  let withAmenities = 0;
  let withRanking = 0;
  let withTripTypes = 0;

  for (const hotel of hotels) {
    if (!hotel.details) continue;
    withDetails++;

    const d = hotel.details;

    if (d.styles && d.styles.length > 0) {
      withStyles++;
      d.styles.forEach((s) => styles.add(s));
    }

    if (d.price_level) {
      withPriceLevel++;
      priceLevels.add(d.price_level);
    }

    if (d.amenities && d.amenities.length > 0) {
      withAmenities++;
      d.amenities.forEach((a) => amenities.add(a));
    }

    if (d.ranking_data) {
      withRanking++;
    }

    if (d.trip_types && d.trip_types.length > 0) {
      withTripTypes++;
      d.trip_types.forEach((t) => tripTypes.add(t.name));
    }

    if (d.subcategory) {
      d.subcategory.forEach((s) => subcategories.add(s.name));
    }
  }

  console.log("=== STATS ===");
  console.log(`Hotels with details: ${withDetails}`);
  console.log(`Hotels with styles: ${withStyles}`);
  console.log(`Hotels with price_level: ${withPriceLevel}`);
  console.log(`Hotels with amenities: ${withAmenities}`);
  console.log(`Hotels with ranking: ${withRanking}`);
  console.log(`Hotels with trip_types: ${withTripTypes}`);

  console.log("\n=== PRICE LEVELS ===");
  const sortedPriceLevels = Array.from(priceLevels).sort();
  console.log(sortedPriceLevels.join(", "));

  console.log("\n=== STYLES (for hotelStyleEnum) ===");
  const sortedStyles = Array.from(styles).sort();
  for (const style of sortedStyles) {
    const enumValue = style
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    console.log(`  "${enumValue}", // ${style}`);
  }

  console.log("\n=== TRIP TYPES ===");
  const sortedTripTypes = Array.from(tripTypes).sort();
  console.log(sortedTripTypes.join(", "));

  console.log("\n=== SUBCATEGORIES ===");
  const sortedSubcategories = Array.from(subcategories).sort();
  console.log(sortedSubcategories.join(", "));

  // Generate amenity mapping
  console.log("\n=== AMENITY MAPPING ===");
  const amenityMapping: Record<string, string> = {};
  const sortedAmenities = Array.from(amenities).sort();

  // Filter out languages (they're not amenities)
  const languages = new Set([
    "Afrikaans", "Arabic", "Azerbaijani", "Bosnian", "Bulgarian", "Burmese",
    "Catalan", "Chinese", "Croatian", "Czech", "Danish", "Dutch", "English",
    "Estonian", "Farsi", "Filipino", "Finnish", "French", "Georgian", "German",
    "Greek", "Hebrew", "Hindi", "Hungarian", "Indonesian", "Italian", "Japanese",
    "Khmer", "Korean", "Latvian", "Lithuanian", "Macedonian", "Malay", "Nepali",
    "Norwegian", "Polish", "Portuguese", "Romanian", "Russian", "Serbian",
    "Sinhala", "Slovak", "Slovenian", "Spanish", "Swahili", "Swedish", "Tamil",
    "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese", "Xhosa", "Zulu"
  ]);

  const actualAmenities = sortedAmenities.filter((a) => !languages.has(a));

  for (const amenity of actualAmenities) {
    const enumValue = amenity
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    amenityMapping[amenity] = enumValue;
  }

  // Save analysis output
  const outputPath = path.join(__dirname, "data-analysis.json");
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        stats: {
          totalHotels: hotels.length,
          withDetails,
          withStyles,
          withPriceLevel,
          withAmenities,
          withRanking,
          withTripTypes,
        },
        priceLevels: sortedPriceLevels,
        styles: sortedStyles,
        tripTypes: sortedTripTypes,
        subcategories: sortedSubcategories,
        amenities: actualAmenities,
        amenityMapping,
        languages: Array.from(languages).sort(),
      },
      null,
      2
    )
  );

  console.log(`\nAnalysis saved to: ${outputPath}`);

  // Print suggested enum values
  console.log("\n=== SUGGESTED hotelStyleEnum VALUES ===");
  console.log("export const hotelStyleEnum = pgEnum('hotel_style', [");
  for (const style of sortedStyles) {
    const enumValue = style
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    console.log(`  "${enumValue}",`);
  }
  console.log("]);");

  // Print price level mapping
  console.log("\n=== PRICE LEVEL MAPPING ===");
  console.log("TripAdvisor -> Our enum:");
  console.log("  $ -> budget");
  console.log("  $$ - $$$ -> moderate");
  console.log("  $$$$ -> upscale");
  console.log("  (none) -> moderate (default)");
}

main().catch(console.error);
