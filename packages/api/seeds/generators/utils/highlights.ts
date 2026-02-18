/**
 * Maps Wikipedia categories and country codes to travel highlights.
 */

// Valid highlight values from schema
export type TravelHighlight =
  | "beaches"
  | "culture"
  | "food"
  | "nightlife"
  | "adventure"
  | "history"
  | "nature"
  | "shopping"
  | "relaxation"
  | "architecture"
  | "wildlife"
  | "mountains"
  | "islands"
  | "temples"
  | "art"
  | "wine"
  | "skiing"
  | "diving"
  | "hiking"
  | "photography";

// Region values from schema
export type Region =
  | "Europe"
  | "East Asia"
  | "Southeast Asia"
  | "South Asia"
  | "North America"
  | "South America"
  | "Central America"
  | "Caribbean"
  | "Middle East"
  | "North Africa"
  | "Sub-Saharan Africa"
  | "Oceania"
  | "Central Asia";

// Category keywords that map to highlights
const CATEGORY_MAPPINGS: Record<string, TravelHighlight[]> = {
  // Beaches & Islands
  beach: ["beaches", "relaxation"],
  "beach resorts": ["beaches", "relaxation"],
  coastal: ["beaches", "nature"],
  seaside: ["beaches", "relaxation"],
  island: ["islands", "beaches"],
  islands: ["islands", "beaches"],
  archipelago: ["islands", "nature"],

  // Culture & History
  unesco: ["culture", "history"],
  "world heritage": ["culture", "history"],
  heritage: ["history", "culture"],
  ancient: ["history", "culture"],
  historic: ["history", "architecture"],
  medieval: ["history", "architecture"],
  roman: ["history", "architecture"],
  colonial: ["history", "architecture"],
  museum: ["culture", "art", "history"],
  festival: ["culture", "nightlife"],
  traditional: ["culture"],

  // Architecture
  architecture: ["architecture"],
  cathedral: ["architecture", "history"],
  castle: ["architecture", "history"],
  palace: ["architecture", "history"],
  mosque: ["architecture", "temples"],
  temple: ["temples", "culture"],
  shrine: ["temples", "culture"],
  church: ["architecture", "history"],

  // Nature & Adventure
  "national park": ["nature", "hiking", "wildlife"],
  "nature reserve": ["nature", "wildlife"],
  mountain: ["mountains", "hiking", "nature"],
  mountains: ["mountains", "hiking"],
  alpine: ["mountains", "skiing"],
  ski: ["skiing", "mountains"],
  hiking: ["hiking", "nature"],
  trekking: ["hiking", "adventure"],
  rainforest: ["nature", "wildlife"],
  forest: ["nature", "hiking"],
  safari: ["wildlife", "adventure"],
  wildlife: ["wildlife", "nature"],
  diving: ["diving", "beaches"],
  snorkeling: ["diving", "beaches"],
  coral: ["diving", "nature"],
  reef: ["diving", "nature"],
  waterfall: ["nature", "photography"],
  canyon: ["nature", "adventure"],
  desert: ["adventure", "nature"],
  volcano: ["nature", "adventure"],
  glacier: ["nature", "adventure"],

  // Food & Wine
  gastronomy: ["food"],
  cuisine: ["food", "culture"],
  culinary: ["food"],
  wine: ["wine", "food"],
  vineyard: ["wine", "nature"],
  "wine region": ["wine", "food"],

  // Shopping & Nightlife
  shopping: ["shopping"],
  market: ["shopping", "culture"],
  bazaar: ["shopping", "culture"],
  nightlife: ["nightlife"],
  entertainment: ["nightlife"],

  // Art
  art: ["art", "culture"],
  gallery: ["art", "culture"],
  "art museum": ["art", "culture"],

  // Photography
  scenic: ["photography", "nature"],
  viewpoint: ["photography"],
  panorama: ["photography", "nature"],
};

// Default highlights by region
const REGION_DEFAULTS: Record<Region, TravelHighlight[]> = {
  Europe: ["culture", "history", "architecture", "food"],
  "East Asia": ["culture", "food", "shopping", "temples"],
  "Southeast Asia": ["beaches", "food", "temples", "nature"],
  "South Asia": ["culture", "temples", "history", "food"],
  "North America": ["nature", "food", "shopping", "adventure"],
  "South America": ["nature", "adventure", "culture", "food"],
  "Central America": ["beaches", "adventure", "nature", "culture"],
  Caribbean: ["beaches", "relaxation", "diving", "islands"],
  "Middle East": ["culture", "history", "architecture", "shopping"],
  "North Africa": ["culture", "history", "adventure", "architecture"],
  "Sub-Saharan Africa": ["wildlife", "nature", "adventure", "culture"],
  Oceania: ["beaches", "nature", "diving", "adventure"],
  "Central Asia": ["mountains", "history", "culture", "adventure"],
};

// Country to region mapping
const COUNTRY_TO_REGION: Record<string, Region> = {
  // Europe
  GB: "Europe",
  FR: "Europe",
  DE: "Europe",
  IT: "Europe",
  ES: "Europe",
  PT: "Europe",
  NL: "Europe",
  BE: "Europe",
  AT: "Europe",
  CH: "Europe",
  GR: "Europe",
  PL: "Europe",
  CZ: "Europe",
  HU: "Europe",
  SE: "Europe",
  NO: "Europe",
  DK: "Europe",
  FI: "Europe",
  IE: "Europe",
  HR: "Europe",
  SI: "Europe",
  SK: "Europe",
  RO: "Europe",
  BG: "Europe",
  RS: "Europe",
  BA: "Europe",
  ME: "Europe",
  MK: "Europe",
  AL: "Europe",
  XK: "Europe",
  EE: "Europe",
  LV: "Europe",
  LT: "Europe",
  IS: "Europe",
  LU: "Europe",
  MT: "Europe",
  CY: "Europe",
  AD: "Europe",
  MC: "Europe",
  SM: "Europe",
  LI: "Europe",
  VA: "Europe",
  RU: "Europe",
  UA: "Europe",
  BY: "Europe",
  MD: "Europe",

  // East Asia
  JP: "East Asia",
  CN: "East Asia",
  KR: "East Asia",
  TW: "East Asia",
  HK: "East Asia",
  MO: "East Asia",
  MN: "East Asia",

  // Southeast Asia
  TH: "Southeast Asia",
  VN: "Southeast Asia",
  ID: "Southeast Asia",
  MY: "Southeast Asia",
  SG: "Southeast Asia",
  PH: "Southeast Asia",
  KH: "Southeast Asia",
  LA: "Southeast Asia",
  MM: "Southeast Asia",
  BN: "Southeast Asia",
  TL: "Southeast Asia",

  // South Asia
  IN: "South Asia",
  NP: "South Asia",
  LK: "South Asia",
  BD: "South Asia",
  PK: "South Asia",
  MV: "South Asia",
  BT: "South Asia",
  AF: "South Asia",

  // Central Asia
  KZ: "Central Asia",
  UZ: "Central Asia",
  TM: "Central Asia",
  KG: "Central Asia",
  TJ: "Central Asia",

  // Middle East
  TR: "Middle East",
  AE: "Middle East",
  SA: "Middle East",
  IL: "Middle East",
  JO: "Middle East",
  LB: "Middle East",
  QA: "Middle East",
  KW: "Middle East",
  BH: "Middle East",
  OM: "Middle East",
  IR: "Middle East",
  IQ: "Middle East",
  SY: "Middle East",
  YE: "Middle East",
  GE: "Middle East",
  AM: "Middle East",
  AZ: "Middle East",

  // North Africa
  EG: "North Africa",
  MA: "North Africa",
  TN: "North Africa",
  DZ: "North Africa",
  LY: "North Africa",

  // Sub-Saharan Africa
  ZA: "Sub-Saharan Africa",
  KE: "Sub-Saharan Africa",
  TZ: "Sub-Saharan Africa",
  ET: "Sub-Saharan Africa",
  NG: "Sub-Saharan Africa",
  GH: "Sub-Saharan Africa",
  SN: "Sub-Saharan Africa",
  RW: "Sub-Saharan Africa",
  UG: "Sub-Saharan Africa",
  ZW: "Sub-Saharan Africa",
  ZM: "Sub-Saharan Africa",
  BW: "Sub-Saharan Africa",
  NA: "Sub-Saharan Africa",
  MZ: "Sub-Saharan Africa",
  MG: "Sub-Saharan Africa",
  MU: "Sub-Saharan Africa",
  SC: "Sub-Saharan Africa",
  CI: "Sub-Saharan Africa",

  // North America
  US: "North America",
  CA: "North America",

  // Central America
  MX: "Central America",
  GT: "Central America",
  BZ: "Central America",
  HN: "Central America",
  SV: "Central America",
  NI: "Central America",
  CR: "Central America",
  PA: "Central America",

  // Caribbean
  CU: "Caribbean",
  JM: "Caribbean",
  DO: "Caribbean",
  PR: "Caribbean",
  BS: "Caribbean",
  BB: "Caribbean",
  TT: "Caribbean",
  AW: "Caribbean",
  CW: "Caribbean",
  LC: "Caribbean",
  HT: "Caribbean",

  // South America
  BR: "South America",
  AR: "South America",
  CL: "South America",
  PE: "South America",
  CO: "South America",
  EC: "South America",
  BO: "South America",
  VE: "South America",
  PY: "South America",
  UY: "South America",

  // Oceania
  AU: "Oceania",
  NZ: "Oceania",
  FJ: "Oceania",
  PF: "Oceania",
  WS: "Oceania",
  VU: "Oceania",
  PW: "Oceania",
  NC: "Oceania",
  PG: "Oceania",
};

/**
 * Maps Wikipedia categories to travel highlights.
 */
export function mapCategoriesToHighlights(
  categories: string[]
): TravelHighlight[] {
  const highlights = new Set<TravelHighlight>();

  for (const category of categories) {
    const lowerCategory = category.toLowerCase();

    for (const [keyword, mappedHighlights] of Object.entries(CATEGORY_MAPPINGS)) {
      if (lowerCategory.includes(keyword)) {
        for (const h of mappedHighlights) {
          highlights.add(h);
        }
      }
    }
  }

  return Array.from(highlights);
}

/**
 * Gets the region for a country code.
 */
export function getRegionForCountry(countryCode: string): Region | null {
  return COUNTRY_TO_REGION[countryCode] ?? null;
}

/**
 * Gets default highlights for a region.
 */
export function getDefaultHighlights(region: Region | null): TravelHighlight[] {
  if (!region) {
    return ["culture", "food", "nature"];
  }
  return REGION_DEFAULTS[region];
}

/**
 * Combines category-derived and default highlights.
 * Returns 3-6 unique highlights.
 */
export function combineHighlights(
  categoryHighlights: TravelHighlight[],
  region: Region | null
): TravelHighlight[] {
  const combined = new Set<TravelHighlight>(categoryHighlights);

  // Add region defaults if we don't have enough
  if (combined.size < 3) {
    const defaults = getDefaultHighlights(region);
    for (const h of defaults) {
      combined.add(h);
      if (combined.size >= 4) break;
    }
  }

  // Limit to 6 highlights
  const result = Array.from(combined);
  return result.slice(0, 6);
}
