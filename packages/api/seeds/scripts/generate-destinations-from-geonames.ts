/// <reference types="node" />
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { regionEnum, travelInterestEnum } from "../../src/db/schema";

/**
 * This script will populate the `data/destinations.json` array with destinations sourced
 * from the files in the `sources/geonames` folder, sourced from https://download.geonames.org/
 */

type Region = (typeof regionEnum.enumValues)[number];
type TravelInterest = (typeof travelInterestEnum.enumValues)[number];

type DestinationSeedRow = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: null;
  description: string;
  highlights: TravelInterest[];
  bestTimeToVisit: string | null;
};

type CountryInfo = {
  countryCode: string;
  countryName: string;
  continentCode: string;
};

type CliArgs = {
  citiesPath: string;
  countriesPath: string;
  outputPath: string;
  limit: number | null;
  minPopulation: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CITIES_PATH = path.join(
  SEEDS_ROOT,
  "sources/geonames/cities5000.txt",
);
const DEFAULT_COUNTRIES_PATH = path.join(
  SEEDS_ROOT,
  "sources/geonames/countryInfo.txt",
);
const DEFAULT_OUTPUT_PATH = path.join(SEEDS_ROOT, "data/destinations.json");

const MIDDLE_EAST_COUNTRIES = new Set([
  "AE",
  "BH",
  "CY",
  "IL",
  "IQ",
  "IR",
  "JO",
  "KW",
  "LB",
  "OM",
  "PS",
  "QA",
  "SA",
  "SY",
  "TR",
  "YE",
]);

const SOUTH_ASIA_COUNTRIES = new Set([
  "AF",
  "BD",
  "BT",
  "IN",
  "LK",
  "MV",
  "NP",
  "PK",
]);

const SOUTHEAST_ASIA_COUNTRIES = new Set([
  "BN",
  "ID",
  "KH",
  "LA",
  "MM",
  "MY",
  "PH",
  "SG",
  "TH",
  "TL",
  "VN",
]);

const EAST_ASIA_COUNTRIES = new Set([
  "CN",
  "HK",
  "JP",
  "KP",
  "KR",
  "MO",
  "MN",
  "TW",
]);

const CENTRAL_ASIA_COUNTRIES = new Set(["KZ", "KG", "TJ", "TM", "UZ"]);

const NORTH_AFRICA_COUNTRIES = new Set([
  "DZ",
  "EG",
  "EH",
  "LY",
  "MA",
  "SD",
  "SS",
  "TN",
]);

const CARIBBEAN_COUNTRIES = new Set([
  "AG",
  "AI",
  "AW",
  "BB",
  "BL",
  "BQ",
  "BS",
  "CU",
  "CW",
  "DM",
  "DO",
  "GD",
  "GP",
  "HT",
  "JM",
  "KN",
  "KY",
  "LC",
  "MF",
  "MQ",
  "MS",
  "PR",
  "SX",
  "TC",
  "TT",
  "VC",
  "VG",
  "VI",
]);

const CENTRAL_AMERICA_COUNTRIES = new Set([
  "BZ",
  "CR",
  "GT",
  "HN",
  "NI",
  "PA",
  "SV",
]);

const DEFAULT_HIGHLIGHTS: TravelInterest[] = ["culture", "food", "nature"];

const REGION_HIGHLIGHT_POOLS: Record<Region, TravelInterest[]> = {
  Europe: [
    "culture",
    "history",
    "architecture",
    "food",
    "art",
    "wine",
    "shopping",
  ],
  "East Asia": [
    "culture",
    "food",
    "shopping",
    "temples",
    "architecture",
    "nightlife",
    "art",
  ],
  "Southeast Asia": [
    "beaches",
    "food",
    "islands",
    "nature",
    "nightlife",
    "diving",
    "temples",
  ],
  "South Asia": [
    "culture",
    "history",
    "food",
    "temples",
    "nature",
    "mountains",
  ],
  "North America": [
    "food",
    "shopping",
    "nightlife",
    "nature",
    "architecture",
    "adventure",
  ],
  "South America": [
    "nature",
    "adventure",
    "food",
    "beaches",
    "hiking",
    "wildlife",
  ],
  "Central America": [
    "beaches",
    "adventure",
    "nature",
    "wildlife",
    "diving",
    "relaxation",
  ],
  Caribbean: [
    "beaches",
    "relaxation",
    "nightlife",
    "islands",
    "diving",
    "food",
  ],
  "Middle East": [
    "culture",
    "history",
    "architecture",
    "food",
    "shopping",
    "nightlife",
  ],
  "North Africa": [
    "culture",
    "history",
    "adventure",
    "architecture",
    "food",
    "nature",
  ],
  "Sub-Saharan Africa": [
    "wildlife",
    "nature",
    "adventure",
    "culture",
    "beaches",
    "photography",
  ],
  Oceania: [
    "beaches",
    "islands",
    "nature",
    "diving",
    "adventure",
    "relaxation",
  ],
  "Central Asia": [
    "mountains",
    "history",
    "nature",
    "adventure",
    "culture",
    "hiking",
  ],
};

function parseCliArgs(argv: string[]): CliArgs {
  let citiesPath = DEFAULT_CITIES_PATH;
  let countriesPath = DEFAULT_COUNTRIES_PATH;
  let outputPath = DEFAULT_OUTPUT_PATH;
  let limit: number | null = null;
  let minPopulation = 5000;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];

    if (arg === "--cities-path" && value) {
      citiesPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--countries-path" && value) {
      countriesPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--output-path" && value) {
      outputPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--limit" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--min-population" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        minPopulation = parsed;
      }
      index += 1;
      continue;
    }
  }

  return { citiesPath, countriesPath, outputPath, limit, minPopulation };
}

function parseCountryInfoFile(input: string): Map<string, CountryInfo> {
  const countries = new Map<string, CountryInfo>();
  const lines = input.split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const columns = line.split("\t");
    if (columns.length < 9) {
      continue;
    }

    const countryCode = columns[0]?.trim().toUpperCase();
    const countryName = columns[4]?.trim();
    const continentCode = columns[8]?.trim().toUpperCase();

    if (!countryCode || countryCode.length !== 2 || !countryName) {
      continue;
    }

    countries.set(countryCode, {
      countryCode,
      countryName,
      continentCode: continentCode || "",
    });
  }

  return countries;
}

function mapCountryToRegion(
  countryCode: string,
  continentCode: string,
): Region | null {
  if (continentCode === "EU") {
    return "Europe";
  }

  if (continentCode === "AF") {
    return NORTH_AFRICA_COUNTRIES.has(countryCode)
      ? "North Africa"
      : "Sub-Saharan Africa";
  }

  if (continentCode === "AS") {
    if (MIDDLE_EAST_COUNTRIES.has(countryCode)) {
      return "Middle East";
    }
    if (SOUTH_ASIA_COUNTRIES.has(countryCode)) {
      return "South Asia";
    }
    if (SOUTHEAST_ASIA_COUNTRIES.has(countryCode)) {
      return "Southeast Asia";
    }
    if (CENTRAL_ASIA_COUNTRIES.has(countryCode)) {
      return "Central Asia";
    }
    if (EAST_ASIA_COUNTRIES.has(countryCode)) {
      return "East Asia";
    }
    return "East Asia";
  }

  if (continentCode === "NA") {
    if (CARIBBEAN_COUNTRIES.has(countryCode)) {
      return "Caribbean";
    }
    if (CENTRAL_AMERICA_COUNTRIES.has(countryCode)) {
      return "Central America";
    }
    return "North America";
  }

  if (continentCode === "SA") {
    return "South America";
  }

  if (continentCode === "OC") {
    return "Oceania";
  }

  return null;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickHighlights(seed: number, region: Region | null): TravelInterest[] {
  const pool =
    region === null ? DEFAULT_HIGHLIGHTS : REGION_HIGHLIGHT_POOLS[region];
  const candidatePool = pool.filter((value) =>
    travelInterestEnum.enumValues.includes(value),
  );

  if (candidatePool.length <= 3) {
    return [...candidatePool];
  }

  const rng = seededRandom(seed);
  const selected = new Set<TravelInterest>();
  while (selected.size < 3) {
    const index = Math.floor(rng() * candidatePool.length);
    selected.add(candidatePool[index] as TravelInterest);
  }
  return Array.from(selected);
}

function deriveBestTimeToVisit(latitude: number): string {
  const absLatitude = Math.abs(latitude);
  const northernHemisphere = latitude >= 0;

  if (absLatitude < 23) {
    return "Year-round";
  }

  if (absLatitude < 35) {
    return northernHemisphere
      ? "March to May and September to November"
      : "September to November and March to May";
  }

  if (absLatitude < 50) {
    return northernHemisphere
      ? "April to June and September to October"
      : "October to December and March to May";
  }

  return northernHemisphere ? "June to August" : "December to February";
}

function parseNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDestinationDescription(
  name: string,
  country: string,
  region: Region | null,
): string {
  if (region) {
    return `${name}, ${country} is a vibrant destination in ${region}, known for local culture, food, and memorable travel experiences.`;
  }
  return `${name}, ${country} offers diverse travel experiences with local culture, food, and iconic points of interest.`;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));

  const [countryInfoRaw, citiesRaw] = await Promise.all([
    readFile(args.countriesPath, "utf8"),
    readFile(args.citiesPath, "utf8"),
  ]);

  const countries = parseCountryInfoFile(countryInfoRaw);
  const rows = citiesRaw.split(/\r?\n/).filter(Boolean);
  const destinations: DestinationSeedRow[] = [];
  const seenIds = new Set<string>();

  let skippedMissingColumns = 0;
  let skippedInvalidCoordinates = 0;
  let skippedMissingCountry = 0;
  let skippedPopulationFilter = 0;
  let skippedDuplicates = 0;

  for (const row of rows) {
    const columns = row.split("\t");
    if (columns.length < 18) {
      skippedMissingColumns += 1;
      continue;
    }

    const geonameId = columns[0]?.trim();
    const name = columns[1]?.trim();
    const latitude = parseNumber(columns[4] ?? "");
    const longitude = parseNumber(columns[5] ?? "");
    const countryCode = (columns[8] ?? "").trim().toUpperCase();
    const population = Number.parseInt(columns[14] ?? "0", 10);
    const timezone = (columns[17] ?? "").trim();

    if (!geonameId || !name || !timezone || !countryCode) {
      skippedMissingColumns += 1;
      continue;
    }

    if (latitude === null || longitude === null) {
      skippedInvalidCoordinates += 1;
      continue;
    }

    if (!Number.isFinite(population) || population < args.minPopulation) {
      skippedPopulationFilter += 1;
      continue;
    }

    const countryInfo = countries.get(countryCode);
    if (!countryInfo) {
      skippedMissingCountry += 1;
      continue;
    }

    const id = `destination_geonames_${geonameId}`;
    if (seenIds.has(id)) {
      skippedDuplicates += 1;
      continue;
    }

    const region = mapCountryToRegion(
      countryCode,
      countryInfo.continentCode || "",
    );
    const numericSeed = Number.parseInt(geonameId, 10);
    const highlights = pickHighlights(
      Number.isFinite(numericSeed) ? numericSeed : 0,
      region,
    );

    destinations.push({
      id,
      name,
      country: countryInfo.countryName,
      countryCode,
      region,
      timezone,
      latitude,
      longitude,
      imageUrl: null,
      description: buildDestinationDescription(
        name,
        countryInfo.countryName,
        region,
      ),
      highlights,
      bestTimeToVisit: deriveBestTimeToVisit(latitude),
    });
    seenIds.add(id);

    if (args.limit !== null && destinations.length >= args.limit) {
      break;
    }
  }

  destinations.sort((a, b) => {
    if (a.countryCode !== b.countryCode) {
      return a.countryCode.localeCompare(b.countryCode);
    }
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name);
    }
    return a.id.localeCompare(b.id);
  });

  await mkdir(path.dirname(args.outputPath), { recursive: true });
  await writeFile(
    args.outputPath,
    `${JSON.stringify(destinations, null, 2)}\n`,
  );

  console.log("Destination generation complete");
  console.log(`Output: ${args.outputPath}`);
  console.log(`Rows scanned: ${rows.length}`);
  console.log(`Destinations written: ${destinations.length}`);
  console.log(`Skipped (missing columns): ${skippedMissingColumns}`);
  console.log(`Skipped (invalid coordinates): ${skippedInvalidCoordinates}`);
  console.log(`Skipped (missing country metadata): ${skippedMissingCountry}`);
  console.log(`Skipped (population filter): ${skippedPopulationFilter}`);
  console.log(`Skipped (duplicates): ${skippedDuplicates}`);
}

main().catch((error) => {
  console.error("Failed to generate destinations:", error);
  process.exit(1);
});
