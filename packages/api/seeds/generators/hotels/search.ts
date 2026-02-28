/**
 * Hotel search worker.
 * Searches TripAdvisor for hotels in each destination.
 * Uses the FREE search endpoint (doesn't count against 5000 limit).
 *
 * Usage:
 *   TRIPADVISOR_API_KEY=xxx tsx seeds/generators/hotels/search.ts
 *
 * Options:
 *   --limit N       Process only first N destinations
 *   --offset N      Skip first N destinations
 *   --dry-run       Don't write output file
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchHotels, sleep, type SearchResult } from "./tripadvisor-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Destination = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
};

type DestinationSearchResult = {
  destinationId: string;
  destinationName: string;
  country: string;
  searchQuery: string;
  hotels: SearchResult[];
  searchedAt: string;
};

type ProgressState = {
  processedCount: number;
  lastProcessedIndex: number;
  results: DestinationSearchResult[];
  errors: Array<{ destination: string; error: string }>;
};

function parseArgs(): {
  limit: number | null;
  offset: number;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let offset = 0;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--offset" && args[i + 1]) {
      offset = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, offset, dryRun };
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

async function main() {
  const { limit, offset, dryRun } = parseArgs();
  const apiKey = process.env.TRIPADVISOR_API_KEY;

  if (!apiKey) {
    console.error("Error: TRIPADVISOR_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("=== Hotel Search (TripAdvisor) ===");
  console.log("Search endpoint is FREE - doesn't count against 5000 limit");
  if (limit) console.log(`Limit: ${limit}`);
  if (offset) console.log(`Offset: ${offset}`);
  if (dryRun) console.log("Dry run mode: no output will be written");
  console.log("");

  // Load destinations
  const destinationsPath = path.join(__dirname, "../../data/destinations.json");
  const destinations: Destination[] = JSON.parse(
    await readFile(destinationsPath, "utf8")
  );
  console.log(`Loaded ${destinations.length} destinations`);

  // Setup output paths - raw files stay in generators/hotels/
  const progressPath = path.join(__dirname, ".search-progress.json");
  const outputPath = path.join(__dirname, "raw-hotels-search.json");

  // Load or initialize progress
  let state = await loadProgress(progressPath);
  if (!state || offset > 0) {
    state = {
      processedCount: 0,
      lastProcessedIndex: offset - 1,
      results: [],
      errors: [],
    };
  }

  // Determine range to process
  const startIndex = state.lastProcessedIndex + 1;
  const endIndex = limit
    ? Math.min(startIndex + limit, destinations.length)
    : destinations.length;

  console.log(
    `Processing destinations ${startIndex + 1} to ${endIndex} of ${destinations.length}`
  );
  console.log("");

  // Process each destination
  for (let i = startIndex; i < endIndex; i++) {
    const dest = destinations[i];
    const progress = `[${i + 1}/${destinations.length}]`;

    try {
      // Build search query - prefer coordinates if available
      let searchQuery = `${dest.name} ${dest.country} hotels`;
      let latLong: string | undefined;

      if (dest.latitude && dest.longitude) {
        latLong = `${dest.latitude},${dest.longitude}`;
      }

      console.log(`${progress} ${dest.name}, ${dest.country}...`);

      const response = await searchHotels(apiKey, searchQuery, {
        latLong,
        radius: 10,
        radiusUnit: "km",
      });

      const result: DestinationSearchResult = {
        destinationId: dest.id,
        destinationName: dest.name,
        country: dest.country,
        searchQuery,
        hotels: response.data || [],
        searchedAt: new Date().toISOString(),
      };

      state.results.push(result);

      console.log(`  -> Found ${result.hotels.length} hotels`);

      if (result.hotels.length > 0) {
        // Show first 3 hotels
        for (const hotel of result.hotels.slice(0, 3)) {
          const rating = hotel.rating ? `★${hotel.rating}` : "no rating";
          console.log(`     - ${hotel.name} (${rating})`);
        }
        if (result.hotels.length > 3) {
          console.log(`     ... and ${result.hotels.length - 3} more`);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  -> ERROR: ${errorMsg}`);
      state.errors.push({
        destination: `${dest.name}, ${dest.country}`,
        error: errorMsg,
      });
    }

    state.processedCount++;
    state.lastProcessedIndex = i;

    // Save progress periodically
    if (i % 20 === 0 && !dryRun) {
      await saveProgress(progressPath, state);
    }

    // Small delay between requests (rate limiting is in client, but be extra safe)
    await sleep(100);
  }

  // Final save
  if (!dryRun) {
    await saveProgress(progressPath, state);
    await writeFile(outputPath, JSON.stringify(state.results, null, 2));
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Processed: ${state.processedCount}`);
  console.log(`Successful: ${state.results.length}`);
  console.log(`Errors: ${state.errors.length}`);
  console.log(`Output: ${outputPath}`);

  // Stats
  const totalHotels = state.results.reduce((sum, r) => sum + r.hotels.length, 0);
  const avgHotels = state.results.length > 0
    ? (totalHotels / state.results.length).toFixed(1)
    : 0;
  const withRatings = state.results.reduce(
    (sum, r) => sum + r.hotels.filter((h) => h.rating).length,
    0
  );

  console.log(`\nTotal hotels found: ${totalHotels}`);
  console.log(`Average per destination: ${avgHotels}`);
  console.log(`Hotels with ratings: ${withRatings}`);

  // Show errors if any
  if (state.errors.length > 0) {
    console.log("\nFailed destinations:");
    for (const { destination, error } of state.errors.slice(0, 10)) {
      console.log(`  - ${destination}: ${error}`);
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
