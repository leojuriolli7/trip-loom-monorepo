/// <reference types="node" />
/**
 * Hotel enrichment worker.
 * Fetches detailed information for top hotels from each destination.
 * Uses the Details endpoint (counts against 5000/month free tier).
 *
 * Usage:
 *   TRIPADVISOR_API_KEY=xxx tsx seeds/generators/hotels/enrich.ts
 *
 * Options:
 *   --limit N          Process only first N destinations
 *   --offset N         Skip first N destinations
 *   --hotels-per N     Number of hotels per destination (default: 7)
 *   --dry-run          Don't write output file
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getHotelDetails,
  sleep,
  type SearchResult,
  type DetailsResponse,
} from "./tripadvisor-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DestinationSearchResult = {
  destinationId: string;
  destinationName: string;
  country: string;
  searchQuery: string;
  hotels: SearchResult[];
  searchedAt: string;
};

type EnrichedHotel = {
  destinationId: string;
  destinationName: string;
  country: string;
  searchResult: SearchResult;
  details: DetailsResponse | null;
  enrichedAt: string;
  error?: string;
};

type ProgressState = {
  processedDestinations: number;
  processedHotels: number;
  apiCallsUsed: number;
  lastDestinationIndex: number;
  hotels: EnrichedHotel[];
  errors: Array<{ hotel: string; destination: string; error: string }>;
};

function parseArgs(): {
  limit: number | null;
  offset: number;
  hotelsPerDestination: number;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let offset = 0;
  let hotelsPerDestination = 7;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--offset" && args[i + 1]) {
      offset = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--hotels-per" && args[i + 1]) {
      hotelsPerDestination = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, offset, hotelsPerDestination, dryRun };
}

async function loadProgress(progressPath: string): Promise<ProgressState | null> {
  try {
    const content = await readFile(progressPath, "utf8");
    return JSON.parse(content) as ProgressState;
  } catch {
    return null;
  }
}

async function saveProgress(
  progressPath: string,
  state: ProgressState
): Promise<void> {
  await writeFile(progressPath, JSON.stringify(state, null, 2));
}

// Sort hotels by rating (best first) and presence of reviews
function sortHotels(hotels: SearchResult[]): SearchResult[] {
  return [...hotels].sort((a, b) => {
    const ratingA = parseFloat(a.rating) || 0;
    const ratingB = parseFloat(b.rating) || 0;
    return ratingB - ratingA;
  });
}

async function main() {
  const { limit, offset, hotelsPerDestination, dryRun } = parseArgs();
  const apiKey = process.env.TRIPADVISOR_API_KEY;

  if (!apiKey) {
    console.error("Error: TRIPADVISOR_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("=== Hotel Enrichment (TripAdvisor) ===");
  console.log(`Hotels per destination: ${hotelsPerDestination}`);
  console.log("⚠️  Each detail call counts against 5000/month free tier");
  if (limit) console.log(`Limit: ${limit} destinations`);
  if (offset) console.log(`Offset: ${offset}`);
  if (dryRun) console.log("Dry run mode: no output will be written");
  console.log("");

  // Load search results
  const searchResultsPath = path.join(__dirname, "raw-hotels-search.json");
  let searchResults: DestinationSearchResult[];
  try {
    searchResults = JSON.parse(await readFile(searchResultsPath, "utf8"));
  } catch {
    console.error("Error: Run search.ts first to generate raw-hotels-search.json");
    process.exit(1);
  }
  console.log(`Loaded search results for ${searchResults.length} destinations`);

  // Calculate expected API calls
  const expectedCalls = searchResults.reduce((sum, r) => {
    return sum + Math.min(r.hotels.length, hotelsPerDestination);
  }, 0);
  console.log(`Expected API calls: ${expectedCalls} (free tier: 5000)`);

  if (expectedCalls > 5000) {
    console.warn(`⚠️  Warning: Expected calls exceed free tier!`);
  }
  console.log("");

  // Setup output paths - raw files stay in generators/hotels/
  const progressPath = path.join(__dirname, ".enrich-progress.json");
  const outputPath = path.join(__dirname, "raw-hotels-details.json");

  // Load or initialize progress
  let state = await loadProgress(progressPath);
  if (!state || offset > 0) {
    state = {
      processedDestinations: 0,
      processedHotels: 0,
      apiCallsUsed: 0,
      lastDestinationIndex: offset - 1,
      hotels: [],
      errors: [],
    };
  }

  console.log(`Resuming from destination ${state.lastDestinationIndex + 2}`);
  console.log(`API calls used so far: ${state.apiCallsUsed}`);
  console.log("");

  // Determine range to process
  const startIndex = state.lastDestinationIndex + 1;
  const endIndex = limit
    ? Math.min(startIndex + limit, searchResults.length)
    : searchResults.length;

  // Process each destination
  for (let i = startIndex; i < endIndex; i++) {
    const destSearch = searchResults[i];
    const progress = `[${i + 1}/${searchResults.length}]`;

    console.log(`${progress} ${destSearch.destinationName}, ${destSearch.country}`);

    if (destSearch.hotels.length === 0) {
      console.log("  -> No hotels to enrich");
      state.processedDestinations++;
      state.lastDestinationIndex = i;
      continue;
    }

    // Sort hotels by rating and take top N
    const sortedHotels = sortHotels(destSearch.hotels);
    const hotelsToEnrich = sortedHotels.slice(0, hotelsPerDestination);

    console.log(
      `  -> Enriching ${hotelsToEnrich.length} of ${destSearch.hotels.length} hotels`
    );

    for (const hotel of hotelsToEnrich) {
      try {
        const details = await getHotelDetails(apiKey, hotel.location_id);
        state.apiCallsUsed++;

        const enriched: EnrichedHotel = {
          destinationId: destSearch.destinationId,
          destinationName: destSearch.destinationName,
          country: destSearch.country,
          searchResult: hotel,
          details,
          enrichedAt: new Date().toISOString(),
        };

        state.hotels.push(enriched);
        state.processedHotels++;

        const amenities = details.amenities?.length ?? 0;
        const rating = details.rating ?? "N/A";
        console.log(`     ✓ ${hotel.name} (★${rating}, ${amenities} amenities)`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`     ✗ ${hotel.name}: ${errorMsg}`);

        // Still save the hotel but without details
        const enriched: EnrichedHotel = {
          destinationId: destSearch.destinationId,
          destinationName: destSearch.destinationName,
          country: destSearch.country,
          searchResult: hotel,
          details: null,
          enrichedAt: new Date().toISOString(),
          error: errorMsg,
        };

        state.hotels.push(enriched);
        state.errors.push({
          hotel: hotel.name,
          destination: `${destSearch.destinationName}, ${destSearch.country}`,
          error: errorMsg,
        });
      }
    }

    state.processedDestinations++;
    state.lastDestinationIndex = i;

    // Save progress periodically
    if (i % 10 === 0 && !dryRun) {
      await saveProgress(progressPath, state);
      console.log(`  [Progress saved - ${state.apiCallsUsed} API calls used]`);
    }

    // Check if we're approaching the limit
    if (state.apiCallsUsed >= 4900) {
      console.warn("\n⚠️  Approaching 5000 API call limit! Stopping...");
      break;
    }
  }

  // Final save
  if (!dryRun) {
    await saveProgress(progressPath, state);
    await writeFile(outputPath, JSON.stringify(state.hotels, null, 2));
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Destinations processed: ${state.processedDestinations}`);
  console.log(`Hotels enriched: ${state.processedHotels}`);
  console.log(`API calls used: ${state.apiCallsUsed}`);
  console.log(`Errors: ${state.errors.length}`);
  console.log(`Output: ${outputPath}`);

  // Stats on enriched data
  const withDescription = state.hotels.filter((h) => h.details?.description).length;
  const withAmenities = state.hotels.filter(
    (h) => h.details?.amenities && h.details.amenities.length > 0
  ).length;
  const withCoords = state.hotels.filter(
    (h) => h.details?.latitude && h.details?.longitude
  ).length;
  const withWebsite = state.hotels.filter((h) => h.details?.website).length;

  console.log(`\nWith descriptions: ${withDescription}`);
  console.log(`With amenities: ${withAmenities}`);
  console.log(`With coordinates: ${withCoords}`);
  console.log(`With websites: ${withWebsite}`);

  // Collect all unique amenities
  const allAmenities = new Set<string>();
  for (const hotel of state.hotels) {
    if (hotel.details?.amenities) {
      for (const amenity of hotel.details.amenities) {
        allAmenities.add(amenity);
      }
    }
  }
  console.log(`\nUnique amenities found: ${allAmenities.size}`);

  // Save amenities list for later schema work
  if (!dryRun && allAmenities.size > 0) {
    const amenitiesPath = path.join(__dirname, "discovered-amenities.json");
    await writeFile(
      amenitiesPath,
      JSON.stringify(Array.from(allAmenities).sort(), null, 2)
    );
    console.log(`Amenities saved to: ${amenitiesPath}`);
  }

  // Show errors if any
  if (state.errors.length > 0) {
    console.log("\nFailed hotels:");
    for (const { hotel, destination, error } of state.errors.slice(0, 10)) {
      console.log(`  - ${hotel} (${destination}): ${error}`);
    }
    if (state.errors.length > 10) {
      console.log(`  ... and ${state.errors.length - 10} more`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
