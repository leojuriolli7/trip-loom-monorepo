/**
 * Destination enrichment worker.
 * Fetches Wikipedia data, images, and generates complete destination records.
 *
 * Usage:
 *   PEXELS_API_KEY=xxx tsx seeds/generators/destinations/enrich.ts
 *
 * Options:
 *   --limit N       Process only first N destinations
 *   --offset N      Skip first N destinations
 *   --dry-run       Don't write output file
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchWikipediaSummary,
  fetchWikipediaCategories,
  fetchWikipediaCoordinates,
  fetchWikipediaImage,
  sleep,
} from "../utils/wikipedia";
import { fetchImageWithFallback, type ImageResult } from "../utils/images";
import {
  mapCategoriesToHighlights,
  getRegionForCountry,
  combineHighlights,
  type TravelHighlight,
  type Region,
} from "../utils/highlights";
import { getTimezoneForCountry, inferBestTimeToVisit } from "../utils/timezone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type MasterCity = {
  name: string;
  country: string;
  countryCode: string;
  wikiSlug: string;
  sources: string[];
};

type DestinationImage = {
  url: string;
  isCover: boolean;
  caption: string;
};

type EnrichedDestination = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  imagesUrls: DestinationImage[] | null;
  description: string;
  highlights: TravelHighlight[];
  bestTimeToVisit: string | null;
};

type ProgressState = {
  processedCount: number;
  lastProcessedIndex: number;
  destinations: EnrichedDestination[];
  errors: Array<{ city: string; error: string }>;
};

// Generate a simple ID
function generateId(name: string, countryCode: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `dest_${countryCode.toLowerCase()}_${slug}`;
}

// Clean up Wikipedia extract for use as description
function cleanDescription(extract: string, cityName: string): string {
  if (!extract) {
    return `${cityName} is a destination known for its unique character and travel experiences.`;
  }

  // Remove parenthetical pronunciations and citations
  let cleaned = extract
    .replace(/\s*\([^)]*pronunciation[^)]*\)/gi, "")
    .replace(/\s*\([^)]*listen[^)]*\)/gi, "")
    .replace(/\s*\([^)]*born[^)]*\)/gi, "") // For people-related articles
    .replace(/\s*\[[^\]]*\]/g, "") // Remove [citation needed] etc
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\s+\./g, ".") // Fix orphan periods
    .trim();

  // Limit to ~3 complete sentences
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 3) {
    cleaned = sentences.slice(0, 3).join(" ").trim();
  }

  // Ensure minimum quality - if too short, keep more sentences
  if (cleaned.length < 100 && sentences.length > 3) {
    cleaned = sentences.slice(0, 4).join(" ").trim();
  }

  // Ensure it ends with a period
  if (cleaned && !cleaned.match(/[.!?]$/)) {
    cleaned += ".";
  }

  // Remove trailing incomplete numbers like "1." at end of truncated sentences
  cleaned = cleaned.replace(/\s+\d+\.$/, ".");

  return cleaned || `${cityName} is a destination known for its unique character and travel experiences.`;
}

// Parse CLI arguments
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

async function enrichDestination(
  city: MasterCity,
  pexelsKey?: string,
  unsplashKey?: string
): Promise<EnrichedDestination> {
  // Fetch Wikipedia data in parallel
  const [summary, categories, coordinates, wikiImage] = await Promise.all([
    fetchWikipediaSummary(city.wikiSlug),
    fetchWikipediaCategories(city.wikiSlug),
    fetchWikipediaCoordinates(city.wikiSlug),
    fetchWikipediaImage(city.wikiSlug),
  ]);

  // Get region
  const region = getRegionForCountry(city.countryCode);

  // Get coordinates (from summary or dedicated API)
  const lat = summary?.coordinates?.lat ?? coordinates?.lat ?? null;
  const lon = summary?.coordinates?.lon ?? coordinates?.lon ?? null;

  // Map categories to highlights
  const categoryHighlights = mapCategoriesToHighlights(categories);
  const highlights = combineHighlights(categoryHighlights, region);

  // Get image with fallback chain
  let image: ImageResult | null = null;
  if (wikiImage) {
    image = await fetchImageWithFallback(city.name, wikiImage, pexelsKey, unsplashKey);
  } else if (pexelsKey) {
    image = await fetchImageWithFallback(city.name, null, pexelsKey, unsplashKey);
  }

  // Clean up description
  const description = cleanDescription(summary?.extract ?? "", city.name);

  // Infer best time to visit
  const bestTimeToVisit = inferBestTimeToVisit(lat, city.countryCode);

  // Get timezone
  const timezone = getTimezoneForCountry(city.countryCode);

  return {
    id: generateId(city.name, city.countryCode),
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    region,
    timezone,
    latitude: lat,
    longitude: lon,
    imagesUrls: image?.url ? [{ url: image.url, isCover: true, caption: "" }] : null,
    description,
    highlights,
    bestTimeToVisit,
  };
}

async function main() {
  const { limit, offset, dryRun } = parseArgs();
  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  console.log("=== Destination Enrichment ===");
  console.log(`Pexels API: ${pexelsKey ? "configured" : "not configured"}`);
  console.log(`Unsplash API: ${unsplashKey ? "configured" : "not configured"}`);
  if (limit) console.log(`Limit: ${limit}`);
  if (offset) console.log(`Offset: ${offset}`);
  if (dryRun) console.log("Dry run mode: no output will be written");
  console.log("");

  // Load master cities
  const masterCitiesPath = path.join(__dirname, "master-cities.json");
  const masterCities: MasterCity[] = JSON.parse(
    await readFile(masterCitiesPath, "utf8")
  );
  console.log(`Loaded ${masterCities.length} cities from master list`);

  // Setup output paths
  const outputDir = path.join(__dirname, "../../data");
  const progressPath = path.join(__dirname, ".enrichment-progress.json");
  const outputPath = path.join(outputDir, "destinations.json");
  await mkdir(outputDir, { recursive: true });

  // Load or initialize progress
  let state = await loadProgress(progressPath);
  if (!state || offset > 0) {
    state = {
      processedCount: 0,
      lastProcessedIndex: offset - 1,
      destinations: [],
      errors: [],
    };
  }

  // Determine range to process
  const startIndex = state.lastProcessedIndex + 1;
  const endIndex = limit ? Math.min(startIndex + limit, masterCities.length) : masterCities.length;

  console.log(`Processing cities ${startIndex + 1} to ${endIndex} of ${masterCities.length}`);
  console.log("");

  // Process each city
  for (let i = startIndex; i < endIndex; i++) {
    const city = masterCities[i];
    const progress = `[${i + 1}/${masterCities.length}]`;

    try {
      console.log(`${progress} ${city.name}, ${city.country}...`);

      const destination = await enrichDestination(city, pexelsKey, unsplashKey);
      state.destinations.push(destination);

      const hasImage = destination.imagesUrls?.length ? "+" : "-";
      const hasCoords = destination.latitude ? "+" : "-";
      console.log(
        `  -> ${destination.highlights.slice(0, 3).join(", ")} | img:${hasImage} coords:${hasCoords}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  -> ERROR: ${errorMsg}`);
      state.errors.push({ city: `${city.name}, ${city.country}`, error: errorMsg });
    }

    state.processedCount++;
    state.lastProcessedIndex = i;

    // Save progress periodically
    if (i % 10 === 0 && !dryRun) {
      await saveProgress(progressPath, state);
    }

    // Rate limiting - 1 request per second to be polite to Wikipedia
    await sleep(1000);
  }

  // Final save
  if (!dryRun) {
    await saveProgress(progressPath, state);
    await writeFile(outputPath, JSON.stringify(state.destinations, null, 2));
  }

  console.log("\n=== Summary ===");
  console.log(`Processed: ${state.processedCount}`);
  console.log(`Successful: ${state.destinations.length}`);
  console.log(`Errors: ${state.errors.length}`);
  console.log(`Output: ${outputPath}`);

  // Stats
  const withImages = state.destinations.filter((d) => d.imagesUrls?.length).length;
  const withCoords = state.destinations.filter((d) => d.latitude).length;
  console.log(`\nWith images: ${withImages} (${Math.round((withImages / state.destinations.length) * 100)}%)`);
  console.log(`With coordinates: ${withCoords} (${Math.round((withCoords / state.destinations.length) * 100)}%)`);

  // Show errors if any
  if (state.errors.length > 0) {
    console.log("\nFailed cities:");
    for (const { city, error } of state.errors.slice(0, 10)) {
      console.log(`  - ${city}: ${error}`);
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
