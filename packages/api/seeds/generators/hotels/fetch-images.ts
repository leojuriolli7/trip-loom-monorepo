/// <reference types="node" />
/**
 * Fetch hotel images from TripAdvisor Photos API.
 * Updates hotels.json with imagesUrls and saves raw responses to raw-hotels-images.json.
 *
 * Usage:
 *   TRIPADVISOR_API_KEY=xxx npx tsx seeds/generators/hotels/fetch-images.ts
 *
 * Options:
 *   --limit N      Process only first N hotels without images
 *   --dry-run      Don't write output files
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getHotelPhotos,
  sleep,
  type PhotosResponse,
} from "./tripadvisor-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type HotelImage = {
  url: string;
  isCover: boolean;
  caption: string;
};

type Hotel = {
  id: string;
  destinationId: string;
  name: string;
  sourceId: string;
  imagesUrls: HotelImage[];
  [key: string]: unknown;
};

type RawImageEntry = {
  hotelId: string;
  sourceId: string;
  photos: PhotosResponse | null;
  fetchedAt: string;
  error?: string;
};

type ProgressState = {
  processedCount: number;
  apiCallsUsed: number;
  lastProcessedIndex: number;
  rawImages: RawImageEntry[];
  errors: Array<{ hotelId: string; name: string; error: string }>;
};

// Graceful shutdown handling
let shuttingDown = false;
let pendingSave: ProgressState | null = null;

function parseArgs(): {
  limit: number | null;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, dryRun };
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

async function saveRawImages(
  rawImagesPath: string,
  rawImages: RawImageEntry[]
): Promise<void> {
  await writeFile(rawImagesPath, JSON.stringify(rawImages, null, 2));
}

async function saveHotels(hotelsPath: string, hotels: Hotel[]): Promise<void> {
  await writeFile(hotelsPath, JSON.stringify(hotels, null, 2));
}

/**
 * Build an imagesUrls array from a photos response.
 * Uses "large" size for each photo, falling back to "original" or "medium".
 * Marks the blessed (featured) photo as isCover, or the first photo if none is blessed.
 */
function buildImagesUrls(photos: PhotosResponse): HotelImage[] {
  if (!photos.data || photos.data.length === 0) {
    return [];
  }

  const blessedIndex = photos.data.findIndex((p) => p.is_blessed);
  const coverIndex = blessedIndex >= 0 ? blessedIndex : 0;

  const images: HotelImage[] = [];
  for (let i = 0; i < photos.data.length; i++) {
    const photo = photos.data[i];
    const url =
      photo.images.large?.url ||
      photo.images.original?.url ||
      photo.images.medium?.url ||
      null;
    if (!url) continue;
    images.push({
      url,
      isCover: i === coverIndex,
      caption: photo.caption?.trim() ?? "",
    });
  }
  return images;
}

async function main() {
  const { limit, dryRun } = parseArgs();
  const apiKey = process.env.TRIPADVISOR_API_KEY;

  if (!apiKey) {
    console.error("Error: TRIPADVISOR_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("=== Hotel Images Fetcher (TripAdvisor) ===");
  if (limit) console.log(`Limit: ${limit} hotels`);
  if (dryRun) console.log("Dry run mode: no output will be written");
  console.log("");

  // Setup paths
  const hotelsPath = path.join(__dirname, "../../data/hotels.json");
  const progressPath = path.join(__dirname, ".fetch-images-progress.json");
  const rawImagesPath = path.join(__dirname, "raw-hotels-images.json");

  // Load hotels
  let hotels: Hotel[];
  try {
    hotels = JSON.parse(await readFile(hotelsPath, "utf8"));
  } catch {
    console.error("Error: Could not load hotels.json");
    process.exit(1);
  }

  console.log(`Loaded ${hotels.length} hotels`);

  // Find hotels without images
  const hotelsNeedingImages = hotels
    .map((hotel, index) => ({ hotel, originalIndex: index }))
    .filter(({ hotel }) => !hotel.imagesUrls?.length);

  console.log(`Hotels without images: ${hotelsNeedingImages.length}`);

  if (hotelsNeedingImages.length === 0) {
    console.log("All hotels already have images!");
    return;
  }

  // Load or initialize progress
  let state = await loadProgress(progressPath);
  if (!state) {
    state = {
      processedCount: 0,
      apiCallsUsed: 0,
      lastProcessedIndex: -1,
      rawImages: [],
      errors: [],
    };
  }

  // Load existing raw images if resuming
  if (state.rawImages.length === 0) {
    try {
      const existingRaw = JSON.parse(await readFile(rawImagesPath, "utf8"));
      state.rawImages = existingRaw;
      console.log(`Loaded ${existingRaw.length} existing raw image records`);
    } catch {
      // No existing file, start fresh
    }
  }

  console.log(`Resuming from index ${state.lastProcessedIndex + 1}`);
  console.log(`API calls used so far: ${state.apiCallsUsed}`);
  console.log("");

  // Set up graceful shutdown
  const gracefulShutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log("\n\nGraceful shutdown initiated...");
    if (pendingSave && !dryRun) {
      console.log("Saving progress...");
      await saveProgress(progressPath, pendingSave);
      await saveRawImages(rawImagesPath, pendingSave.rawImages);
      await saveHotels(hotelsPath, hotels);
      console.log("Progress saved.");
    }
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);

  // Determine range to process
  const startIndex = state.lastProcessedIndex + 1;
  const endIndex = limit
    ? Math.min(startIndex + limit, hotelsNeedingImages.length)
    : hotelsNeedingImages.length;

  const toProcess = hotelsNeedingImages.slice(startIndex, endIndex);
  console.log(`Processing ${toProcess.length} hotels (indices ${startIndex} to ${endIndex - 1})`);
  console.log("");

  // Build a map of sourceId to raw images for quick lookup
  const rawImagesBySourceId = new Map<string, RawImageEntry>();
  for (const entry of state.rawImages) {
    rawImagesBySourceId.set(entry.sourceId, entry);
  }

  // Process hotels
  for (let i = 0; i < toProcess.length; i++) {
    if (shuttingDown) break;

    const { hotel, originalIndex } = toProcess[i];
    const globalIndex = startIndex + i;
    const progress = `[${globalIndex + 1}/${hotelsNeedingImages.length}]`;

    // Check if we already have photos for this hotel
    const existingEntry = rawImagesBySourceId.get(hotel.sourceId);
    if (existingEntry && existingEntry.photos) {
      const imagesUrls = buildImagesUrls(existingEntry.photos);
      if (imagesUrls.length > 0) {
        hotels[originalIndex].imagesUrls = imagesUrls;
        console.log(`${progress} ${hotel.name} - using cached image`);
        state.lastProcessedIndex = globalIndex;
        state.processedCount++;
        pendingSave = state;
        continue;
      }
    }

    try {
      const photos = await getHotelPhotos(apiKey, hotel.sourceId);
      state.apiCallsUsed++;

      const imagesUrls = buildImagesUrls(photos);

      // Update hotel in memory
      hotels[originalIndex].imagesUrls = imagesUrls;

      // Store raw response
      const rawEntry: RawImageEntry = {
        hotelId: hotel.id,
        sourceId: hotel.sourceId,
        photos,
        fetchedAt: new Date().toISOString(),
      };

      // Update or add to raw images
      const existingIdx = state.rawImages.findIndex(
        (r) => r.sourceId === hotel.sourceId
      );
      if (existingIdx >= 0) {
        state.rawImages[existingIdx] = rawEntry;
      } else {
        state.rawImages.push(rawEntry);
      }
      rawImagesBySourceId.set(hotel.sourceId, rawEntry);

      state.processedCount++;
      state.lastProcessedIndex = globalIndex;
      pendingSave = state;

      const photoCount = photos.data?.length ?? 0;
      const status = imagesUrls.length > 0 ? `✓ ${photoCount} photos` : `✗ no photos`;
      console.log(`${progress} ${hotel.name} - ${status}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`${progress} ${hotel.name} - ERROR: ${errorMsg}`);

      // Check for daily limit exceeded
      if (errorMsg.includes("429") || errorMsg.includes("rate limit")) {
        console.log("\n⚠️  Rate limit hit. Saving progress and stopping...");
        if (!dryRun) {
          await saveProgress(progressPath, state);
          await saveRawImages(rawImagesPath, state.rawImages);
          await saveHotels(hotelsPath, hotels);
        }
        break;
      }

      // Store error in raw images
      const rawEntry: RawImageEntry = {
        hotelId: hotel.id,
        sourceId: hotel.sourceId,
        photos: null,
        fetchedAt: new Date().toISOString(),
        error: errorMsg,
      };

      const existingIdx = state.rawImages.findIndex(
        (r) => r.sourceId === hotel.sourceId
      );
      if (existingIdx >= 0) {
        state.rawImages[existingIdx] = rawEntry;
      } else {
        state.rawImages.push(rawEntry);
      }

      state.errors.push({
        hotelId: hotel.id,
        name: hotel.name,
        error: errorMsg,
      });

      state.lastProcessedIndex = globalIndex;
      pendingSave = state;
    }

    // Save progress every 10 hotels
    if ((i + 1) % 10 === 0 && !dryRun) {
      await saveProgress(progressPath, state);
      await saveRawImages(rawImagesPath, state.rawImages);
      await saveHotels(hotelsPath, hotels);
      console.log(`  [Progress saved - ${state.apiCallsUsed} API calls used]`);
    }

    // Small delay between requests (on top of rate limiting in client)
    await sleep(100);
  }

  // Final save
  if (!dryRun && !shuttingDown) {
    await saveProgress(progressPath, state);
    await saveRawImages(rawImagesPath, state.rawImages);
    await saveHotels(hotelsPath, hotels);
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Hotels processed: ${state.processedCount}`);
  console.log(`API calls used: ${state.apiCallsUsed}`);
  console.log(`Errors: ${state.errors.length}`);

  // Count hotels with images now
  const withImages = hotels.filter((h) => h.imagesUrls?.length).length;
  const withoutImages = hotels.filter((h) => !h.imagesUrls?.length).length;
  console.log(`\nHotels with images: ${withImages}`);
  console.log(`Hotels without images: ${withoutImages}`);

  // Count photos per hotel
  const photosCounts = state.rawImages
    .filter((r) => r.photos)
    .map((r) => r.photos!.data?.length ?? 0);

  if (photosCounts.length > 0) {
    const avgPhotos = photosCounts.reduce((a, b) => a + b, 0) / photosCounts.length;
    const maxPhotos = Math.max(...photosCounts);
    const minPhotos = Math.min(...photosCounts);
    console.log(
      `\nPhotos per hotel: min ${minPhotos}, avg ${avgPhotos.toFixed(1)}, max ${maxPhotos}`
    );
  }

  if (state.errors.length > 0) {
    console.log("\nRecent errors:");
    for (const { name, error } of state.errors.slice(-10)) {
      console.log(`  - ${name}: ${error}`);
    }
  }

  console.log(`\nOutput files:`);
  console.log(`  - ${hotelsPath} (updated with imagesUrls)`);
  console.log(`  - ${rawImagesPath} (raw TripAdvisor responses)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
