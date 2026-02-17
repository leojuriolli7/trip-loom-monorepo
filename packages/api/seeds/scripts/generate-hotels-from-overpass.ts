/// <reference types="node" />
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { amenityEnum, priceRangeEnum, regionEnum } from "../../src/db/schema";

/**
 * Fetches Overpass API for places and filters out for hotels, and normalizes data into `hotels.json`
 * for seeding to our db.
 *
 * Running the script:
 *
 * ```
 * pnpm data:populate:hotels
 * ```
 */

type Amenity = (typeof amenityEnum.enumValues)[number];
type PriceRange = (typeof priceRangeEnum.enumValues)[number];
type Region = (typeof regionEnum.enumValues)[number];

type DestinationInput = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region | null;
  timezone: string;
  latitude: number;
  longitude: number;
};

type HotelSeedRow = {
  id: string;
  destinationId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  source: string | null;
  sourceId: string | null;
  starRating: number;
  amenities: Amenity[];
  priceRange: PriceRange;
  avgPricePerNightInCents: number;
  description: string;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string | undefined>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type HotelCandidate = HotelSeedRow & {
  distanceKm: number;
};

type CliArgs = {
  destinationsPath: string;
  outputPath: string;
  endpoint: string;
  fallbackEndpoint: string | null;
  radiusMeters: number;
  delayMs: number;
  timeoutMs: number;
  maxRetries: number;
  limit: number | null;
  offset: number;
  countryCodes: Set<string>;
  replaceOutput: boolean;
  failOnDestinationErrors: boolean;
  validateImages: boolean;
  imageValidationConcurrency: number;
  imageValidationTimeoutMs: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DESTINATIONS_PATH = path.join(
  SEEDS_ROOT,
  "data/destinations.json",
);
const DEFAULT_OUTPUT_PATH = path.join(SEEDS_ROOT, "data/hotels.json");
const DEFAULT_ENDPOINT = "https://overpass-api.de/api/interpreter";
const DEFAULT_FALLBACK_ENDPOINT =
  "https://overpass.kumi.systems/api/interpreter";
const NON_DIRECT_IMAGE_HOSTS = new Set([
  "photos.app.goo.gl",
  "goo.gl",
  "drive.google.com",
  "maps.app.goo.gl",
]);

const destinationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  region: z.enum(regionEnum.enumValues).nullable(),
  timezone: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

const hotelSchema = z.object({
  id: z.string().min(1),
  destinationId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().url().nullable(),
  source: z.string().min(1).nullable().default(null),
  sourceId: z.string().min(1).nullable().default(null),
  starRating: z.number().int().min(1).max(5),
  amenities: z.array(z.enum(amenityEnum.enumValues)).min(1),
  priceRange: z.enum(priceRangeEnum.enumValues),
  avgPricePerNightInCents: z.number().int().positive(),
  description: z.string().min(1),
});

const hotelsFileSchema = z.array(hotelSchema);

function parseCliArgs(argv: string[]): CliArgs {
  let destinationsPath = DEFAULT_DESTINATIONS_PATH;
  let outputPath = DEFAULT_OUTPUT_PATH;
  let endpoint = DEFAULT_ENDPOINT;
  let fallbackEndpoint: string | null = DEFAULT_FALLBACK_ENDPOINT;
  let radiusMeters = 30000;
  let delayMs = 1200;
  let timeoutMs = 90000;
  let maxRetries = 3;
  let limit: number | null = null;
  let offset = 0;
  const countryCodes = new Set<string>();
  let replaceOutput = false;
  let failOnDestinationErrors = false;
  let validateImages = true;
  let imageValidationConcurrency = 8;
  let imageValidationTimeoutMs = 7000;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];

    if (arg === "--destinations-path" && value) {
      destinationsPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--output-path" && value) {
      outputPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--endpoint" && value) {
      endpoint = value.trim();
      index += 1;
      continue;
    }
    if (arg === "--fallback-endpoint" && value) {
      fallbackEndpoint = value.trim() ? value.trim() : null;
      index += 1;
      continue;
    }
    if (arg === "--radius-meters" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        radiusMeters = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--delay-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        delayMs = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        timeoutMs = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--max-retries" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        maxRetries = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--limit" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        limit = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--offset" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        offset = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--country-code" && value) {
      value
        .split(",")
        .map((entry) => entry.trim().toUpperCase())
        .filter((entry) => entry.length === 2)
        .forEach((entry) => countryCodes.add(entry));
      index += 1;
      continue;
    }
    if (arg === "--replace-output") {
      replaceOutput = true;
      continue;
    }
    if (arg === "--fail-on-destination-errors") {
      failOnDestinationErrors = true;
      continue;
    }
    if (arg === "--skip-image-validation") {
      validateImages = false;
      continue;
    }
    if (arg === "--image-validation-concurrency" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        imageValidationConcurrency = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--image-validation-timeout-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        imageValidationTimeoutMs = parsed;
      }
      index += 1;
      continue;
    }
  }

  return {
    destinationsPath,
    outputPath,
    endpoint,
    fallbackEndpoint,
    radiusMeters,
    delayMs,
    timeoutMs,
    maxRetries,
    limit,
    offset,
    countryCodes,
    replaceOutput,
    failOnDestinationErrors,
    validateImages,
    imageValidationConcurrency,
    imageValidationTimeoutMs,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function buildOverpassQuery(
  lat: number,
  lon: number,
  radiusMeters: number,
): string {
  return [
    "[out:json][timeout:90];",
    "(",
    `  node["tourism"~"hotel|motel|guest_house|hostel|resort"](around:${radiusMeters},${lat},${lon});`,
    `  way["tourism"~"hotel|motel|guest_house|hostel|resort"](around:${radiusMeters},${lat},${lon});`,
    `  relation["tourism"~"hotel|motel|guest_house|hostel|resort"](around:${radiusMeters},${lat},${lon});`,
    ");",
    "out center tags;",
  ].join("\n");
}

function parseOverpassCoordinates(
  element: OverpassElement,
): { lat: number; lon: number } | null {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lon: element.lon };
  }

  if (
    typeof element.center?.lat === "number" &&
    typeof element.center?.lon === "number"
  ) {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  return null;
}

function toBooleanTag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "yes" || normalized === "true" || normalized === "1";
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeHttpUrl(rawValue: string | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  const firstCandidate = rawValue
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.length > 0);

  if (!firstCandidate || !/^https?:\/\//i.test(firstCandidate)) {
    return null;
  }

  try {
    const parsed = new URL(firstCandidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (NON_DIRECT_IMAGE_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function toWikimediaFilePathUrl(rawValue: string | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const directUrl = normalizeHttpUrl(trimmed);
  if (directUrl) {
    return directUrl;
  }

  if (/^Category:/i.test(trimmed)) {
    return null;
  }

  const withoutPrefix = trimmed.replace(/^File:/i, "").trim();
  if (!withoutPrefix) {
    return null;
  }

  const normalizedFileName = withoutPrefix.replace(/\s+/g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    normalizedFileName,
  )}`;
}

function extractImageUrl(
  tags: Record<string, string | undefined>,
): string | null {
  const directUrlFields = [
    tags.image,
    tags["image:url"],
    tags.image_url,
    tags["contact:image"],
    tags.photo,
    tags["flickr"],
  ];

  for (const field of directUrlFields) {
    const normalized = normalizeHttpUrl(field);
    if (normalized) {
      return normalized;
    }
  }

  const wikimediaFields = [
    tags.wikimedia_commons,
    tags["wikimedia_commons:image"],
    tags["wikimedia:commons"],
    tags.image,
  ];

  for (const field of wikimediaFields) {
    const normalized = toWikimediaFilePathUrl(field);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function toHashInt(input: string): number {
  const hash = createHash("sha256").update(input).digest("hex");
  return Number.parseInt(hash.slice(0, 8), 16) >>> 0;
}

function seededRandomFromString(input: string): () => number {
  let state = toHashInt(input);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function pickAmenities(tags: Record<string, string | undefined>): Amenity[] {
  const amenities = new Set<Amenity>();

  if (
    toBooleanTag(tags.wifi) ||
    toBooleanTag(tags["internet_access"]) ||
    tags["internet_access"]?.toLowerCase() === "wlan"
  ) {
    amenities.add("wifi");
  }
  if (toBooleanTag(tags["swimming_pool"])) {
    amenities.add("pool");
  }
  if (toBooleanTag(tags.spa) || toBooleanTag(tags.sauna)) {
    amenities.add("spa");
  }
  if (toBooleanTag(tags.gym) || toBooleanTag(tags["fitness_centre"])) {
    amenities.add("gym");
  }
  if (toBooleanTag(tags.restaurant)) {
    amenities.add("restaurant");
  }
  if (toBooleanTag(tags.bar)) {
    amenities.add("bar");
  }
  if (toBooleanTag(tags.parking)) {
    amenities.add("parking");
  }
  if (toBooleanTag(tags.shuttle) || toBooleanTag(tags["airport_shuttle"])) {
    amenities.add("airport-shuttle");
  }
  if (toBooleanTag(tags.pets)) {
    amenities.add("pet-friendly");
  }
  if (toBooleanTag(tags["air_conditioning"])) {
    amenities.add("air-conditioning");
  }

  if (amenities.size === 0) {
    amenities.add("wifi");
  }

  return Array.from(amenities);
}

function parseStarRating(
  tags: Record<string, string | undefined>,
  seed: string,
): number {
  const starFields = [tags.stars, tags["hotel:stars"]];
  for (const value of starFields) {
    if (!value) {
      continue;
    }
    const match = value.match(/[1-5]/);
    if (match) {
      return Number.parseInt(match[0], 10);
    }
  }

  const rng = seededRandomFromString(seed);
  const roll = rng();
  if (roll < 0.05) {
    return 1;
  }
  if (roll < 0.25) {
    return 2;
  }
  if (roll < 0.7) {
    return 3;
  }
  if (roll < 0.93) {
    return 4;
  }
  return 5;
}

function mapStarToPriceRange(starRating: number): PriceRange {
  if (starRating <= 2) {
    return "budget";
  }
  if (starRating === 3) {
    return "moderate";
  }
  if (starRating === 4) {
    return "upscale";
  }
  return "luxury";
}

function regionPriceMultiplier(region: Region | null): number {
  switch (region) {
    case "North America":
      return 1.35;
    case "Europe":
      return 1.25;
    case "Oceania":
      return 1.3;
    case "Middle East":
      return 1.2;
    case "Caribbean":
      return 1.15;
    case "East Asia":
      return 1.05;
    case "Southeast Asia":
      return 0.8;
    case "South Asia":
      return 0.7;
    case "South America":
      return 0.85;
    case "Central America":
      return 0.85;
    case "North Africa":
      return 0.8;
    case "Sub-Saharan Africa":
      return 0.75;
    case "Central Asia":
      return 0.72;
    default:
      return 1;
  }
}

function deriveAveragePrice(
  priceRange: PriceRange,
  region: Region | null,
  seed: string,
): number {
  const rng = seededRandomFromString(seed);

  const ranges: Record<PriceRange, { min: number; max: number }> = {
    budget: { min: 5000, max: 12000 },
    moderate: { min: 10000, max: 26000 },
    upscale: { min: 22000, max: 45000 },
    luxury: { min: 42000, max: 90000 },
  };

  const { min, max } = ranges[priceRange];
  const multiplier = regionPriceMultiplier(region);
  const base = min + Math.floor((max - min) * rng());
  const adjusted = Math.round(base * multiplier);
  return Math.max(3000, adjusted);
}

function buildAddress(
  tags: Record<string, string | undefined>,
  destination: DestinationInput,
): string {
  const houseNumber = tags["addr:housenumber"]?.trim();
  const street = tags["addr:street"]?.trim();
  const city = tags["addr:city"]?.trim();
  const postcode = tags["addr:postcode"]?.trim();

  const line1 = normalizeWhitespace(
    [houseNumber, street].filter(Boolean).join(" "),
  );
  const line2 = normalizeWhitespace(
    [city ?? destination.name, postcode, destination.country]
      .filter(Boolean)
      .join(", "),
  );
  const address = normalizeWhitespace(
    [line1, line2].filter(Boolean).join(", "),
  );

  if (address.length > 0) {
    return address;
  }

  return `${destination.name}, ${destination.country}`;
}

function buildDescription(
  name: string,
  destination: DestinationInput,
  starRating: number,
  amenities: Amenity[],
  tourismType: string | undefined,
): string {
  const typeLabel = tourismType ? tourismType.replace("_", " ") : "hotel";
  const topAmenities = amenities.slice(0, 2).join(" and ");
  return `${name} is a ${starRating}-star ${typeLabel} in ${destination.name}, ${destination.country}, offering travelers comfort and convenient access to local attractions${topAmenities ? ` with amenities like ${topAmenities}` : ""}.`;
}

function buildStableHotelId(sourceId: string): string {
  const hash = createHash("sha256").update(sourceId).digest("hex").slice(0, 16);
  return `hotel_osm_${hash}`;
}

function buildSourceId(element: OverpassElement): string {
  return `${element.type}/${element.id}`;
}

function isImageContentType(contentTypeHeader: string | null): boolean {
  if (!contentTypeHeader) {
    return false;
  }
  const contentType = contentTypeHeader.split(";")[0]?.trim().toLowerCase();
  return contentType.startsWith("image/");
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function validateImageUrl(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  try {
    const headResponse = await fetchWithTimeout(
      url,
      {
        method: "HEAD",
        headers: {
          Accept: "image/*,*/*;q=0.8",
          "User-Agent": "trip-loom-hotel-seeder/1.0",
        },
      },
      timeoutMs,
    );

    if (headResponse.ok) {
      const contentType = headResponse.headers.get("content-type");
      if (isImageContentType(contentType)) {
        return true;
      }
    }
  } catch {
    // Fall through to GET probe.
  }

  try {
    const getResponse = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Accept: "image/*,*/*;q=0.8",
          Range: "bytes=0-0",
          "User-Agent": "trip-loom-hotel-seeder/1.0",
        },
      },
      timeoutMs,
    );

    if (!getResponse.ok) {
      return false;
    }
    return isImageContentType(getResponse.headers.get("content-type"));
  } catch {
    return false;
  }
}

async function validateTouchedImageUrls(
  bestBySourceId: Map<string, HotelCandidate>,
  touchedKeys: Set<string>,
  args: CliArgs,
): Promise<{ checked: number; removed: number }> {
  if (!args.validateImages || touchedKeys.size === 0) {
    return { checked: 0, removed: 0 };
  }

  const keysToValidate = Array.from(touchedKeys).filter((key) => {
    const candidate = bestBySourceId.get(key);
    return Boolean(candidate?.imageUrl);
  });

  if (keysToValidate.length === 0) {
    return { checked: 0, removed: 0 };
  }

  const cache = new Map<string, Promise<boolean>>();
  let cursor = 0;
  let removed = 0;
  let checked = 0;
  const workerCount = Math.min(
    args.imageValidationConcurrency,
    keysToValidate.length,
  );

  const validateWithCache = (url: string): Promise<boolean> => {
    const existing = cache.get(url);
    if (existing) {
      return existing;
    }

    const promise = validateImageUrl(url, args.imageValidationTimeoutMs);
    cache.set(url, promise);
    return promise;
  };

  const worker = async () => {
    while (cursor < keysToValidate.length) {
      const index = cursor;
      cursor += 1;
      const key = keysToValidate[index];
      const candidate = bestBySourceId.get(key);
      if (!candidate || !candidate.imageUrl) {
        continue;
      }

      checked += 1;
      const isValid = await validateWithCache(candidate.imageUrl);
      if (!isValid) {
        candidate.imageUrl = null;
        removed += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return { checked, removed };
}

async function fetchOverpass(
  endpoint: string,
  query: string,
  timeoutMs: number,
): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const payload = (await response.json()) as OverpassResponse;
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOverpassWithRetries(
  args: CliArgs,
  query: string,
): Promise<OverpassResponse> {
  const endpoints = [args.endpoint];
  if (args.fallbackEndpoint) {
    endpoints.push(args.fallbackEndpoint);
  }

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= args.maxRetries; attempt += 1) {
    for (const endpoint of endpoints) {
      try {
        return await fetchOverpass(endpoint, query, args.timeoutMs);
      } catch (error) {
        lastError = error;
      }
    }
    const backoffMs = Math.min(8000, args.delayMs * 2 ** attempt);
    await sleep(backoffMs);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unknown Overpass error");
}

function toDestinationInput(
  rawDestinations: unknown[],
  countryCodes: Set<string>,
  offset: number,
  limit: number | null,
): DestinationInput[] {
  const parsed = rawDestinations
    .map((row) => destinationSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter(
      (destination) =>
        destination.latitude !== null && destination.longitude !== null,
    )
    .filter((destination) =>
      countryCodes.size === 0
        ? true
        : countryCodes.has(destination.countryCode),
    )
    .map(
      (destination): DestinationInput => ({
        id: destination.id,
        name: destination.name,
        country: destination.country,
        countryCode: destination.countryCode,
        region: destination.region,
        timezone: destination.timezone,
        latitude: destination.latitude as number,
        longitude: destination.longitude as number,
      }),
    );

  const sliced = parsed.slice(offset);
  if (limit === null) {
    return sliced;
  }
  return sliced.slice(0, limit);
}

function parseExistingHotels(raw: unknown): HotelSeedRow[] {
  const parsed = hotelsFileSchema.safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));

  const destinationsRaw = JSON.parse(
    await readFile(args.destinationsPath, "utf8"),
  ) as unknown[];
  const destinations = toDestinationInput(
    destinationsRaw,
    args.countryCodes,
    args.offset,
    args.limit,
  );

  const existingHotels = args.replaceOutput
    ? []
    : parseExistingHotels(
        JSON.parse(
          await readFile(args.outputPath, "utf8").catch(() => "[]"),
        ) as unknown,
      );

  const bestBySourceId = new Map<string, HotelCandidate>();
  const touchedKeys = new Set<string>();

  for (const existing of existingHotels) {
    if (existing.source === "osm" && existing.sourceId) {
      bestBySourceId.set(existing.sourceId, {
        ...existing,
        distanceKm: Number.POSITIVE_INFINITY,
      });
    } else {
      bestBySourceId.set(existing.id, {
        ...existing,
        distanceKm: Number.POSITIVE_INFINITY,
      });
    }
  }

  let queriedDestinations = 0;
  let failedDestinations = 0;
  let totalElements = 0;
  let skippedUnnamed = 0;
  let skippedNoCoords = 0;
  let acceptedCandidates = 0;

  for (let index = 0; index < destinations.length; index += 1) {
    const destination = destinations[index];
    if (index > 0 && args.delayMs > 0) {
      await sleep(args.delayMs);
    }

    const query = buildOverpassQuery(
      destination.latitude,
      destination.longitude,
      args.radiusMeters,
    );

    let response: OverpassResponse;
    try {
      response = await fetchOverpassWithRetries(args, query);
      queriedDestinations += 1;
    } catch (error) {
      failedDestinations += 1;
      console.warn(
        `Failed destination ${destination.id} (${destination.name}): ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
      continue;
    }

    const elements = Array.isArray(response.elements) ? response.elements : [];
    totalElements += elements.length;

    for (const element of elements) {
      const tags = element.tags ?? {};
      const name = normalizeWhitespace(tags.name?.trim() ?? "");
      if (!name) {
        skippedUnnamed += 1;
        continue;
      }

      const coordinates = parseOverpassCoordinates(element);
      if (!coordinates) {
        skippedNoCoords += 1;
        continue;
      }

      const sourceId = buildSourceId(element);
      const distanceKm = haversineDistanceKm(
        destination.latitude,
        destination.longitude,
        coordinates.lat,
        coordinates.lon,
      );

      const starRating = parseStarRating(tags, sourceId);
      const priceRange = mapStarToPriceRange(starRating);
      const amenities = pickAmenities(tags);

      const candidate: HotelCandidate = {
        id: buildStableHotelId(sourceId),
        destinationId: destination.id,
        name,
        address: buildAddress(tags, destination),
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        imageUrl: extractImageUrl(tags),
        source: "osm",
        sourceId,
        starRating,
        amenities,
        priceRange,
        avgPricePerNightInCents: deriveAveragePrice(
          priceRange,
          destination.region,
          sourceId,
        ),
        description: buildDescription(
          name,
          destination,
          starRating,
          amenities,
          tags.tourism,
        ),
        distanceKm,
      };

      const existing = bestBySourceId.get(sourceId);
      if (!existing || candidate.distanceKm < existing.distanceKm) {
        bestBySourceId.set(sourceId, candidate);
        touchedKeys.add(sourceId);
      }
      acceptedCandidates += 1;
    }
  }

  const imageValidation = await validateTouchedImageUrls(
    bestBySourceId,
    touchedKeys,
    args,
  );

  const merged = Array.from(bestBySourceId.values())
    .map(({ distanceKm: _distanceKm, ...hotel }) => hotel)
    .sort((a, b) => a.id.localeCompare(b.id));

  await mkdir(path.dirname(args.outputPath), { recursive: true });
  await writeFile(args.outputPath, `${JSON.stringify(merged, null, 2)}\n`);

  console.log("Hotel generation complete");
  console.log(`Output: ${args.outputPath}`);
  console.log(`Queried destinations: ${queriedDestinations}`);
  console.log(`Failed destinations: ${failedDestinations}`);
  console.log(`Overpass elements read: ${totalElements}`);
  console.log(`Accepted candidates: ${acceptedCandidates}`);
  console.log(`Skipped (missing name): ${skippedUnnamed}`);
  console.log(`Skipped (missing coords): ${skippedNoCoords}`);
  console.log(`Image URLs checked: ${imageValidation.checked}`);
  console.log(`Invalid image URLs removed: ${imageValidation.removed}`);
  console.log(`Total hotels in output: ${merged.length}`);
  console.log(
    `Hotels with image URLs: ${
      merged.filter((hotel) => hotel.imageUrl !== null).length
    }`,
  );

  if (args.failOnDestinationErrors && failedDestinations > 0) {
    throw new Error(
      `Failed destination lookups detected: ${failedDestinations}`,
    );
  }
}

main().catch((error) => {
  console.error("Failed to generate hotels:", error);
  process.exit(1);
});
