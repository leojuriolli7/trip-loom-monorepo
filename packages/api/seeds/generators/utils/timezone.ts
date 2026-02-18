/**
 * Timezone inference based on coordinates and country.
 * Uses a simplified approach - for production you'd want a proper timezone DB.
 */

// Capital city timezones for each country (common timezone)
const COUNTRY_TIMEZONES: Record<string, string> = {
  // Europe
  GB: "Europe/London",
  FR: "Europe/Paris",
  DE: "Europe/Berlin",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  NL: "Europe/Amsterdam",
  BE: "Europe/Brussels",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  GR: "Europe/Athens",
  PL: "Europe/Warsaw",
  CZ: "Europe/Prague",
  HU: "Europe/Budapest",
  SE: "Europe/Stockholm",
  NO: "Europe/Oslo",
  DK: "Europe/Copenhagen",
  FI: "Europe/Helsinki",
  IE: "Europe/Dublin",
  HR: "Europe/Zagreb",
  SI: "Europe/Ljubljana",
  SK: "Europe/Bratislava",
  RO: "Europe/Bucharest",
  BG: "Europe/Sofia",
  RS: "Europe/Belgrade",
  BA: "Europe/Sarajevo",
  ME: "Europe/Podgorica",
  MK: "Europe/Skopje",
  AL: "Europe/Tirane",
  XK: "Europe/Belgrade",
  EE: "Europe/Tallinn",
  LV: "Europe/Riga",
  LT: "Europe/Vilnius",
  IS: "Atlantic/Reykjavik",
  LU: "Europe/Luxembourg",
  MT: "Europe/Malta",
  CY: "Asia/Nicosia",
  AD: "Europe/Andorra",
  MC: "Europe/Monaco",
  SM: "Europe/San_Marino",
  LI: "Europe/Vaduz",
  VA: "Europe/Vatican",
  RU: "Europe/Moscow",
  UA: "Europe/Kyiv",
  BY: "Europe/Minsk",
  MD: "Europe/Chisinau",

  // East Asia
  JP: "Asia/Tokyo",
  CN: "Asia/Shanghai",
  KR: "Asia/Seoul",
  TW: "Asia/Taipei",
  HK: "Asia/Hong_Kong",
  MO: "Asia/Macau",
  MN: "Asia/Ulaanbaatar",

  // Southeast Asia
  TH: "Asia/Bangkok",
  VN: "Asia/Ho_Chi_Minh",
  ID: "Asia/Jakarta",
  MY: "Asia/Kuala_Lumpur",
  SG: "Asia/Singapore",
  PH: "Asia/Manila",
  KH: "Asia/Phnom_Penh",
  LA: "Asia/Vientiane",
  MM: "Asia/Yangon",
  BN: "Asia/Brunei",
  TL: "Asia/Dili",

  // South Asia
  IN: "Asia/Kolkata",
  NP: "Asia/Kathmandu",
  LK: "Asia/Colombo",
  BD: "Asia/Dhaka",
  PK: "Asia/Karachi",
  MV: "Indian/Maldives",
  BT: "Asia/Thimphu",
  AF: "Asia/Kabul",

  // Central Asia
  KZ: "Asia/Almaty",
  UZ: "Asia/Tashkent",
  TM: "Asia/Ashgabat",
  KG: "Asia/Bishkek",
  TJ: "Asia/Dushanbe",

  // Middle East
  TR: "Europe/Istanbul",
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  IL: "Asia/Jerusalem",
  JO: "Asia/Amman",
  LB: "Asia/Beirut",
  QA: "Asia/Qatar",
  KW: "Asia/Kuwait",
  BH: "Asia/Bahrain",
  OM: "Asia/Muscat",
  IR: "Asia/Tehran",
  IQ: "Asia/Baghdad",
  SY: "Asia/Damascus",
  YE: "Asia/Aden",
  GE: "Asia/Tbilisi",
  AM: "Asia/Yerevan",
  AZ: "Asia/Baku",

  // North Africa
  EG: "Africa/Cairo",
  MA: "Africa/Casablanca",
  TN: "Africa/Tunis",
  DZ: "Africa/Algiers",
  LY: "Africa/Tripoli",

  // Sub-Saharan Africa
  ZA: "Africa/Johannesburg",
  KE: "Africa/Nairobi",
  TZ: "Africa/Dar_es_Salaam",
  ET: "Africa/Addis_Ababa",
  NG: "Africa/Lagos",
  GH: "Africa/Accra",
  SN: "Africa/Dakar",
  RW: "Africa/Kigali",
  UG: "Africa/Kampala",
  ZW: "Africa/Harare",
  ZM: "Africa/Lusaka",
  BW: "Africa/Gaborone",
  NA: "Africa/Windhoek",
  MZ: "Africa/Maputo",
  MG: "Indian/Antananarivo",
  MU: "Indian/Mauritius",
  SC: "Indian/Mahe",
  CI: "Africa/Abidjan",

  // North America
  US: "America/New_York",
  CA: "America/Toronto",

  // Central America
  MX: "America/Mexico_City",
  GT: "America/Guatemala",
  BZ: "America/Belize",
  HN: "America/Tegucigalpa",
  SV: "America/El_Salvador",
  NI: "America/Managua",
  CR: "America/Costa_Rica",
  PA: "America/Panama",

  // Caribbean
  CU: "America/Havana",
  JM: "America/Jamaica",
  DO: "America/Santo_Domingo",
  PR: "America/Puerto_Rico",
  BS: "America/Nassau",
  BB: "America/Barbados",
  TT: "America/Port_of_Spain",
  AW: "America/Aruba",
  CW: "America/Curacao",
  LC: "America/St_Lucia",
  HT: "America/Port-au-Prince",

  // South America
  BR: "America/Sao_Paulo",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  PE: "America/Lima",
  CO: "America/Bogota",
  EC: "America/Guayaquil",
  BO: "America/La_Paz",
  VE: "America/Caracas",
  PY: "America/Asuncion",
  UY: "America/Montevideo",

  // Oceania
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  FJ: "Pacific/Fiji",
  PF: "Pacific/Tahiti",
  WS: "Pacific/Apia",
  VU: "Pacific/Efate",
  PW: "Pacific/Palau",
  NC: "Pacific/Noumea",
  PG: "Pacific/Port_Moresby",
};

/**
 * Gets the timezone for a country code.
 * Falls back to UTC if unknown.
 */
export function getTimezoneForCountry(countryCode: string): string {
  return COUNTRY_TIMEZONES[countryCode] ?? "UTC";
}

/**
 * Infers best time to visit based on latitude (hemisphere) and region.
 */
export function inferBestTimeToVisit(
  lat: number | null,
  countryCode: string
): string {
  if (lat === null) {
    return "Year-round";
  }

  const absLat = Math.abs(lat);
  const isNorthern = lat >= 0;

  // Tropical regions (near equator)
  if (absLat < 23) {
    // Check for monsoon regions
    const monsoonCountries = ["IN", "TH", "VN", "KH", "LA", "MM", "BD", "LK", "NP"];
    if (monsoonCountries.includes(countryCode)) {
      return "November to February (dry season)";
    }

    // Caribbean and tropical islands - hurricane season matters
    const hurricaneRegion = ["BS", "JM", "CU", "DO", "PR", "BB", "LC"];
    if (hurricaneRegion.includes(countryCode)) {
      return "December to April (outside hurricane season)";
    }

    return "Year-round, with dry season preferred";
  }

  // Subtropical (23-35 degrees)
  if (absLat < 35) {
    if (isNorthern) {
      return "March to May and September to November";
    }
    return "September to November and March to May";
  }

  // Temperate (35-50 degrees)
  if (absLat < 50) {
    if (isNorthern) {
      return "April to October";
    }
    return "October to April";
  }

  // Northern/Southern high latitudes
  if (isNorthern) {
    // Northern Europe, Alaska, etc
    return "June to August";
  }
  return "December to February";
}
