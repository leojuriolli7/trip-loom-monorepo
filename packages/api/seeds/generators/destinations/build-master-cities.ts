/**
 * Parses Wikipedia lists to build a master city list.
 *
 * Sources:
 * - List of cities by international visitors (top tourist cities)
 * - List of national capitals
 * - List of largest cities
 * - List of cities by GDP
 *
 * Run: tsx seeds/generators/destinations/build-master-cities.ts
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveCountryTemplate,
  getCountryByName,
  type CountryInfo,
} from "../utils/country-codes";
import { CURATED_ADDITIONS } from "./curated-additions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type MasterCity = {
  name: string;
  country: string;
  countryCode: string;
  wikiSlug: string;
  sources: string[]; // Which Wikipedia lists mentioned this city
};

type WikipediaApiResponse = {
  query: {
    pages: Array<{
      revisions?: Array<{
        slots: {
          main: {
            content: string;
          };
        };
      }>;
    }>;
  };
};

/**
 * Extracts city names from [[City Name]] patterns.
 * Handles:
 * - [[Bangkok]]
 * - [[New York City]]
 * - [[São Paulo]]
 * - [[City, State|City]] (piped links)
 */
function extractCityLinks(
  wikitext: string,
): Array<{ name: string; slug: string }> {
  const cities: Array<{ name: string; slug: string }> = [];
  // Match [[...]] but not [[File:...]] or [[Category:...]]
  const linkRegex = /\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(wikitext)) !== null) {
    const slug = match[1].trim();
    const displayName = match[2]?.trim() || slug;

    // Skip non-city links
    if (
      slug.startsWith("File:") ||
      slug.startsWith("Category:") ||
      slug.startsWith("Template:") ||
      slug.startsWith("Wikipedia:") ||
      slug.startsWith("Help:") ||
      slug.startsWith("WP:") ||
      slug.includes("#") // Section links
    ) {
      continue;
    }

    // Skip common non-city terms
    const skipTerms = [
      "international",
      "visitors",
      "arrivals",
      "tourism",
      "million",
      "growth",
      "rank",
      "country",
      "territory",
      "source",
      "euromonitor",
      "mastercard",
      "bloomberg",
      "cite web",
      "cite news",
      "management consulting",
      "financial services",
      "capital",
      "continent",
      "notes",
      "list of",
    ];

    if (skipTerms.some((term) => slug.toLowerCase().includes(term))) {
      continue;
    }

    cities.push({ name: displayName, slug });
  }

  return cities;
}

/**
 * Parses a wikitable to extract city-country pairs.
 */
function parseWikitableForCities(
  wikitext: string,
  sourceName: string,
): Array<{ city: string; slug: string; country: CountryInfo | null }> {
  const results: Array<{
    city: string;
    slug: string;
    country: CountryInfo | null;
  }> = [];

  // Split by table rows
  const rows = wikitext.split(/\|-/);

  for (const row of rows) {
    // Look for city links in this row
    const cityLinks = extractCityLinks(row);

    // Look for country templates in this row
    const countryMatch = row.match(
      /\{\{(?:flaglist|flag|flagicon|[A-Z]{3})[^}]*\}\}/i,
    );
    let country: CountryInfo | null = null;

    if (countryMatch) {
      country = resolveCountryTemplate(countryMatch[0]);
    }

    // For each potential city in the row, add it
    for (const cityLink of cityLinks) {
      // Basic heuristic: city names are usually capitalized and not too long
      if (cityLink.name.length > 2 && cityLink.name.length < 50) {
        results.push({
          city: cityLink.name,
          slug: cityLink.slug,
          country,
        });
      }
    }
  }

  return results;
}

/**
 * Parse the capitals list which has a different format:
 * | [[City]] || {{flaglist|Country}} || Continent || Notes
 */
function parseCapitalsList(
  wikitext: string,
): Array<{ city: string; slug: string; country: CountryInfo | null }> {
  const results: Array<{
    city: string;
    slug: string;
    country: CountryInfo | null;
  }> = [];
  const rows = wikitext.split(/\|-/);

  for (const row of rows) {
    // Skip header rows and empty rows
    if (!row.includes("[[") || row.includes("!scope")) {
      continue;
    }

    // Split by || to get columns
    const columns = row.split(/\|\|/).map((c) => c.trim());
    if (columns.length < 2) continue;

    // First column should have the city
    const cityMatch = columns[0].match(/\[\[([^\[\]|]+?)(?:\|[^\[\]]+?)?\]\]/);
    if (!cityMatch) continue;

    const citySlug = cityMatch[1].trim();
    // Remove annotations like {{small|(de facto)}}
    const cityName = citySlug.replace(/,.*$/, "").trim();

    // Second column should have the country
    const countryCol = columns[1] || "";
    const countryMatch = countryCol.match(/\{\{(?:flaglist|flag)[^}]+\}\}/i);
    let country: CountryInfo | null = null;

    if (countryMatch) {
      country = resolveCountryTemplate(countryMatch[0]);
    }

    // Skip entries that don't look like real cities
    if (
      cityName.length < 3 ||
      cityName.includes("(") ||
      cityName.toLowerCase().includes("capital") ||
      cityName.toLowerCase().includes("territory")
    ) {
      continue;
    }

    results.push({
      city: cityName,
      slug: citySlug,
      country,
    });
  }

  return results;
}

/**
 * Loads and parses a Wikipedia JSON file.
 */
async function loadWikipediaJson(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, "utf8");
    const data = JSON.parse(content) as WikipediaApiResponse;
    return data.query.pages[0]?.revisions?.[0]?.slots.main.content ?? null;
  } catch {
    console.warn(`Failed to load ${filePath}`);
    return null;
  }
}

async function main() {
  // Output to same directory (master-cities.json is an intermediate file)
  const outputDir = __dirname;

  const citiesMap = new Map<string, MasterCity>();

  // Patterns to filter out (not actual cities)
  const FILTER_PATTERNS = [
    /\bMSA\b/i, // Metropolitan Statistical Area
    /\bMetropolitan Area\b/i,
    /\bMetro Area\b/i,
    /\bUrban Area\b/i,
    /\bGreater\s/i, // "Greater London" etc.
    /\bMetro\b$/i, // ends with "Metro"
    /,\s*[A-Z]{2}\s+MSA$/i, // ", CA MSA" pattern
    /,\s*[A-Z]{2}-[A-Z]{2}\s+MSA$/i, // ", OH-PA MSA" pattern
    /\bUniversity\b/i, // Universities are not cities
    /\bAirport\b/i, // Airports are not cities
    /–.+–/i, // Multi-city combos like "Kyoto–Osaka–Kobe"
    /^[^–]+–[^–]+$/, // Two-city combos like "Fukuoka–Kitakyushu"
  ];

  const shouldFilterCity = (name: string): boolean => {
    return FILTER_PATTERNS.some((pattern) => pattern.test(name));
  };

  // Helper to add a city to the map
  const addCity = (
    name: string,
    slug: string,
    country: CountryInfo | null,
    source: string,
  ) => {
    if (!country) return;

    // Filter out MSA and metropolitan area entries
    if (shouldFilterCity(name)) {
      return;
    }

    // Normalize the key
    const key = `${name.toLowerCase()}|${country.code}`;

    if (citiesMap.has(key)) {
      // Add source if not already present
      const existing = citiesMap.get(key)!;
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
    } else {
      citiesMap.set(key, {
        name,
        country: country.name,
        countryCode: country.code,
        wikiSlug: slug.replace(/ /g, "_"),
        sources: [source],
      });
    }
  };

  // 1. Parse "List of cities by international visitors"
  console.log("Parsing: List of cities by international visitors...");
  const visitorsContent = await loadWikipediaJson(
    "/tmp/wiki-cities-visitors.json",
  );
  if (visitorsContent) {
    const cities = parseWikitableForCities(visitorsContent, "visitors");
    for (const { city, slug, country } of cities) {
      addCity(city, slug, country, "visitors");
    }
    console.log(`  Found ${cities.length} entries`);
  }

  // 2. Parse "List of national capitals"
  console.log("Parsing: List of national capitals...");
  const capitalsContent = await loadWikipediaJson("/tmp/wiki-capitals.json");
  if (capitalsContent) {
    const cities = parseCapitalsList(capitalsContent);
    for (const { city, slug, country } of cities) {
      addCity(city, slug, country, "capitals");
    }
    console.log(`  Found ${cities.length} entries`);
  }

  // 3. Parse "List of largest cities"
  console.log("Parsing: List of largest cities...");
  const largestContent = await loadWikipediaJson(
    "/tmp/wiki-largest-cities.json",
  );
  if (largestContent) {
    const cities = parseWikitableForCities(largestContent, "largest");
    for (const { city, slug, country } of cities) {
      addCity(city, slug, country, "largest");
    }
    console.log(`  Found ${cities.length} entries`);
  }

  // 4. Parse "List of cities by GDP"
  console.log("Parsing: List of cities by GDP...");
  const gdpContent = await loadWikipediaJson("/tmp/wiki-cities-gdp.json");
  if (gdpContent) {
    const cities = parseWikitableForCities(gdpContent, "gdp");
    for (const { city, slug, country } of cities) {
      addCity(city, slug, country, "gdp");
    }
    console.log(`  Found ${cities.length} entries`);
  }

  // 5. Add curated destinations (tourist hotspots, hidden gems)
  console.log("Adding curated destinations...");
  let curatedAdded = 0;
  for (const curated of CURATED_ADDITIONS) {
    const key = `${curated.name.toLowerCase()}|${curated.countryCode}`;
    if (citiesMap.has(key)) {
      // Add "curated" source to existing entry
      const existing = citiesMap.get(key)!;
      if (!existing.sources.includes("curated")) {
        existing.sources.push("curated");
      }
    } else {
      // Add new entry
      citiesMap.set(key, {
        name: curated.name,
        country: curated.country,
        countryCode: curated.countryCode,
        wikiSlug: curated.wikiSlug,
        sources: ["curated"],
      });
      curatedAdded++;
    }
  }
  console.log(
    `  Added ${curatedAdded} new destinations (${CURATED_ADDITIONS.length - curatedAdded} already existed)`,
  );

  // Convert to array and sort
  const masterCities = Array.from(citiesMap.values());

  // Sort by number of sources (most mentioned first), then by name
  masterCities.sort((a, b) => {
    if (b.sources.length !== a.sources.length) {
      return b.sources.length - a.sources.length;
    }
    return a.name.localeCompare(b.name);
  });

  // Output
  const outputPath = path.join(outputDir, "master-cities.json");
  await writeFile(outputPath, JSON.stringify(masterCities, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Total unique cities: ${masterCities.length}`);
  console.log(
    `Cities in multiple lists: ${masterCities.filter((c) => c.sources.length > 1).length}`,
  );
  console.log(`Output: ${outputPath}`);

  // Show top cities by mention count
  console.log("\nTop cities (mentioned in multiple lists):");
  masterCities
    .filter((c) => c.sources.length > 1)
    .slice(0, 20)
    .forEach((c) => {
      console.log(`  ${c.name}, ${c.country} (${c.sources.join(", ")})`);
    });
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
