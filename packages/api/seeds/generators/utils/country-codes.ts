/**
 * Maps Wikipedia country template codes to ISO 3166-1 alpha-2 codes and country names.
 * Handles both short codes (THA, GBR) and flaglist templates (flaglist|Thailand).
 */

export type CountryInfo = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
};

// Wikipedia uses ISO 3166-1 alpha-3 or custom codes in templates
const TEMPLATE_TO_COUNTRY: Record<string, CountryInfo> = {
  // Common short codes (alpha-3 or custom)
  THA: { code: "TH", name: "Thailand" },
  HKG: { code: "HK", name: "Hong Kong" },
  GBR: { code: "GB", name: "United Kingdom" },
  MAC: { code: "MO", name: "Macau" },
  TUR: { code: "TR", name: "Turkey" },
  UAE: { code: "AE", name: "United Arab Emirates" },
  ARE: { code: "AE", name: "United Arab Emirates" },
  SAU: { code: "SA", name: "Saudi Arabia" },
  FRA: { code: "FR", name: "France" },
  MYS: { code: "MY", name: "Malaysia" },
  USA: { code: "US", name: "United States" },
  CHN: { code: "CN", name: "China" },
  JPN: { code: "JP", name: "Japan" },
  KOR: { code: "KR", name: "South Korea" },
  SGP: { code: "SG", name: "Singapore" },
  ITA: { code: "IT", name: "Italy" },
  ESP: { code: "ES", name: "Spain" },
  DEU: { code: "DE", name: "Germany" },
  NLD: { code: "NL", name: "Netherlands" },
  AUT: { code: "AT", name: "Austria" },
  CHE: { code: "CH", name: "Switzerland" },
  BEL: { code: "BE", name: "Belgium" },
  PRT: { code: "PT", name: "Portugal" },
  GRC: { code: "GR", name: "Greece" },
  CZE: { code: "CZ", name: "Czech Republic" },
  POL: { code: "PL", name: "Poland" },
  HUN: { code: "HU", name: "Hungary" },
  SWE: { code: "SE", name: "Sweden" },
  NOR: { code: "NO", name: "Norway" },
  DNK: { code: "DK", name: "Denmark" },
  FIN: { code: "FI", name: "Finland" },
  IRL: { code: "IE", name: "Ireland" },
  RUS: { code: "RU", name: "Russia" },
  UKR: { code: "UA", name: "Ukraine" },
  IND: { code: "IN", name: "India" },
  IDN: { code: "ID", name: "Indonesia" },
  VNM: { code: "VN", name: "Vietnam" },
  PHL: { code: "PH", name: "Philippines" },
  TWN: { code: "TW", name: "Taiwan" },
  AUS: { code: "AU", name: "Australia" },
  NZL: { code: "NZ", name: "New Zealand" },
  CAN: { code: "CA", name: "Canada" },
  MEX: { code: "MX", name: "Mexico" },
  BRA: { code: "BR", name: "Brazil" },
  ARG: { code: "AR", name: "Argentina" },
  CHL: { code: "CL", name: "Chile" },
  COL: { code: "CO", name: "Colombia" },
  PER: { code: "PE", name: "Peru" },
  EGY: { code: "EG", name: "Egypt" },
  ZAF: { code: "ZA", name: "South Africa" },
  MAR: { code: "MA", name: "Morocco" },
  KEN: { code: "KE", name: "Kenya" },
  NGA: { code: "NG", name: "Nigeria" },
  ISR: { code: "IL", name: "Israel" },
  JOR: { code: "JO", name: "Jordan" },
  LBN: { code: "LB", name: "Lebanon" },
  QAT: { code: "QA", name: "Qatar" },
  KWT: { code: "KW", name: "Kuwait" },
  BHR: { code: "BH", name: "Bahrain" },
  OMN: { code: "OM", name: "Oman" },
};

// Full country names from flaglist templates
const COUNTRY_NAME_TO_INFO: Record<string, CountryInfo> = {
  Thailand: { code: "TH", name: "Thailand" },
  "Hong Kong": { code: "HK", name: "Hong Kong" },
  "United Kingdom": { code: "GB", name: "United Kingdom" },
  Macau: { code: "MO", name: "Macau" },
  Turkey: { code: "TR", name: "Turkey" },
  "United Arab Emirates": { code: "AE", name: "United Arab Emirates" },
  "Saudi Arabia": { code: "SA", name: "Saudi Arabia" },
  France: { code: "FR", name: "France" },
  Malaysia: { code: "MY", name: "Malaysia" },
  "United States": { code: "US", name: "United States" },
  China: { code: "CN", name: "China" },
  Japan: { code: "JP", name: "Japan" },
  "South Korea": { code: "KR", name: "South Korea" },
  Singapore: { code: "SG", name: "Singapore" },
  Italy: { code: "IT", name: "Italy" },
  Spain: { code: "ES", name: "Spain" },
  Germany: { code: "DE", name: "Germany" },
  Netherlands: { code: "NL", name: "Netherlands" },
  Austria: { code: "AT", name: "Austria" },
  Switzerland: { code: "CH", name: "Switzerland" },
  Belgium: { code: "BE", name: "Belgium" },
  Portugal: { code: "PT", name: "Portugal" },
  Greece: { code: "GR", name: "Greece" },
  "Czech Republic": { code: "CZ", name: "Czech Republic" },
  Czechia: { code: "CZ", name: "Czech Republic" },
  Poland: { code: "PL", name: "Poland" },
  Hungary: { code: "HU", name: "Hungary" },
  Sweden: { code: "SE", name: "Sweden" },
  Norway: { code: "NO", name: "Norway" },
  Denmark: { code: "DK", name: "Denmark" },
  Finland: { code: "FI", name: "Finland" },
  Ireland: { code: "IE", name: "Ireland" },
  Russia: { code: "RU", name: "Russia" },
  Ukraine: { code: "UA", name: "Ukraine" },
  India: { code: "IN", name: "India" },
  Indonesia: { code: "ID", name: "Indonesia" },
  Vietnam: { code: "VN", name: "Vietnam" },
  Philippines: { code: "PH", name: "Philippines" },
  Taiwan: { code: "TW", name: "Taiwan" },
  Australia: { code: "AU", name: "Australia" },
  "New Zealand": { code: "NZ", name: "New Zealand" },
  Canada: { code: "CA", name: "Canada" },
  Mexico: { code: "MX", name: "Mexico" },
  Brazil: { code: "BR", name: "Brazil" },
  Argentina: { code: "AR", name: "Argentina" },
  Chile: { code: "CL", name: "Chile" },
  Colombia: { code: "CO", name: "Colombia" },
  Peru: { code: "PE", name: "Peru" },
  Egypt: { code: "EG", name: "Egypt" },
  "South Africa": { code: "ZA", name: "South Africa" },
  Morocco: { code: "MA", name: "Morocco" },
  Kenya: { code: "KE", name: "Kenya" },
  Nigeria: { code: "NG", name: "Nigeria" },
  Israel: { code: "IL", name: "Israel" },
  Jordan: { code: "JO", name: "Jordan" },
  Lebanon: { code: "LB", name: "Lebanon" },
  Qatar: { code: "QA", name: "Qatar" },
  Kuwait: { code: "KW", name: "Kuwait" },
  Bahrain: { code: "BH", name: "Bahrain" },
  Oman: { code: "OM", name: "Oman" },
  Croatia: { code: "HR", name: "Croatia" },
  Slovenia: { code: "SI", name: "Slovenia" },
  Slovakia: { code: "SK", name: "Slovakia" },
  Romania: { code: "RO", name: "Romania" },
  Bulgaria: { code: "BG", name: "Bulgaria" },
  Serbia: { code: "RS", name: "Serbia" },
  "Bosnia and Herzegovina": { code: "BA", name: "Bosnia and Herzegovina" },
  Montenegro: { code: "ME", name: "Montenegro" },
  "North Macedonia": { code: "MK", name: "North Macedonia" },
  Albania: { code: "AL", name: "Albania" },
  Kosovo: { code: "XK", name: "Kosovo" },
  Estonia: { code: "EE", name: "Estonia" },
  Latvia: { code: "LV", name: "Latvia" },
  Lithuania: { code: "LT", name: "Lithuania" },
  Belarus: { code: "BY", name: "Belarus" },
  Moldova: { code: "MD", name: "Moldova" },
  Georgia: { code: "GE", name: "Georgia" },
  Armenia: { code: "AM", name: "Armenia" },
  Azerbaijan: { code: "AZ", name: "Azerbaijan" },
  Kazakhstan: { code: "KZ", name: "Kazakhstan" },
  Uzbekistan: { code: "UZ", name: "Uzbekistan" },
  Turkmenistan: { code: "TM", name: "Turkmenistan" },
  Kyrgyzstan: { code: "KG", name: "Kyrgyzstan" },
  Tajikistan: { code: "TJ", name: "Tajikistan" },
  Mongolia: { code: "MN", name: "Mongolia" },
  Nepal: { code: "NP", name: "Nepal" },
  Bangladesh: { code: "BD", name: "Bangladesh" },
  "Sri Lanka": { code: "LK", name: "Sri Lanka" },
  Pakistan: { code: "PK", name: "Pakistan" },
  Afghanistan: { code: "AF", name: "Afghanistan" },
  Iran: { code: "IR", name: "Iran" },
  Iraq: { code: "IQ", name: "Iraq" },
  Syria: { code: "SY", name: "Syria" },
  Yemen: { code: "YE", name: "Yemen" },
  Cambodia: { code: "KH", name: "Cambodia" },
  Laos: { code: "LA", name: "Laos" },
  Myanmar: { code: "MM", name: "Myanmar" },
  Brunei: { code: "BN", name: "Brunei" },
  "Timor-Leste": { code: "TL", name: "Timor-Leste" },
  Maldives: { code: "MV", name: "Maldives" },
  Bhutan: { code: "BT", name: "Bhutan" },
  "Ivory Coast": { code: "CI", name: "Ivory Coast" },
  "Côte d'Ivoire": { code: "CI", name: "Ivory Coast" },
  Ghana: { code: "GH", name: "Ghana" },
  Senegal: { code: "SN", name: "Senegal" },
  Tanzania: { code: "TZ", name: "Tanzania" },
  Ethiopia: { code: "ET", name: "Ethiopia" },
  Uganda: { code: "UG", name: "Uganda" },
  Rwanda: { code: "RW", name: "Rwanda" },
  Tunisia: { code: "TN", name: "Tunisia" },
  Algeria: { code: "DZ", name: "Algeria" },
  Libya: { code: "LY", name: "Libya" },
  Sudan: { code: "SD", name: "Sudan" },
  Namibia: { code: "NA", name: "Namibia" },
  Botswana: { code: "BW", name: "Botswana" },
  Zimbabwe: { code: "ZW", name: "Zimbabwe" },
  Zambia: { code: "ZM", name: "Zambia" },
  Mozambique: { code: "MZ", name: "Mozambique" },
  Madagascar: { code: "MG", name: "Madagascar" },
  Mauritius: { code: "MU", name: "Mauritius" },
  Seychelles: { code: "SC", name: "Seychelles" },
  Ecuador: { code: "EC", name: "Ecuador" },
  Bolivia: { code: "BO", name: "Bolivia" },
  Paraguay: { code: "PY", name: "Paraguay" },
  Uruguay: { code: "UY", name: "Uruguay" },
  Venezuela: { code: "VE", name: "Venezuela" },
  Panama: { code: "PA", name: "Panama" },
  "Costa Rica": { code: "CR", name: "Costa Rica" },
  Guatemala: { code: "GT", name: "Guatemala" },
  Honduras: { code: "HN", name: "Honduras" },
  "El Salvador": { code: "SV", name: "El Salvador" },
  Nicaragua: { code: "NI", name: "Nicaragua" },
  Belize: { code: "BZ", name: "Belize" },
  Cuba: { code: "CU", name: "Cuba" },
  Jamaica: { code: "JM", name: "Jamaica" },
  "Dominican Republic": { code: "DO", name: "Dominican Republic" },
  Haiti: { code: "HT", name: "Haiti" },
  "Puerto Rico": { code: "PR", name: "Puerto Rico" },
  Bahamas: { code: "BS", name: "Bahamas" },
  "Trinidad and Tobago": { code: "TT", name: "Trinidad and Tobago" },
  Barbados: { code: "BB", name: "Barbados" },
  Aruba: { code: "AW", name: "Aruba" },
  Curaçao: { code: "CW", name: "Curaçao" },
  Iceland: { code: "IS", name: "Iceland" },
  Luxembourg: { code: "LU", name: "Luxembourg" },
  Malta: { code: "MT", name: "Malta" },
  Cyprus: { code: "CY", name: "Cyprus" },
  Andorra: { code: "AD", name: "Andorra" },
  Monaco: { code: "MC", name: "Monaco" },
  "San Marino": { code: "SM", name: "San Marino" },
  Liechtenstein: { code: "LI", name: "Liechtenstein" },
  "Vatican City": { code: "VA", name: "Vatican City" },
  Fiji: { code: "FJ", name: "Fiji" },
  "Papua New Guinea": { code: "PG", name: "Papua New Guinea" },
  Samoa: { code: "WS", name: "Samoa" },
  Tonga: { code: "TO", name: "Tonga" },
  Vanuatu: { code: "VU", name: "Vanuatu" },
  "Solomon Islands": { code: "SB", name: "Solomon Islands" },
  "French Polynesia": { code: "PF", name: "French Polynesia" },
  "New Caledonia": { code: "NC", name: "New Caledonia" },
  Guam: { code: "GU", name: "Guam" },
  Gambia: { code: "GM", name: "Gambia" },
  "Central African Republic": { code: "CF", name: "Central African Republic" },
  Eritrea: { code: "ER", name: "Eritrea" },
  Mali: { code: "ML", name: "Mali" },
  "Saint Kitts and Nevis": { code: "KN", name: "Saint Kitts and Nevis" },
  "Cook Islands": { code: "CK", name: "Cook Islands" },
  Niue: { code: "NU", name: "Niue" },
  Tokelau: { code: "TK", name: "Tokelau" },
  "Pitcairn Islands": { code: "PN", name: "Pitcairn Islands" },
};

/**
 * Resolves a Wikipedia country template to CountryInfo.
 * Handles formats like:
 * - {{THA}}
 * - {{flaglist|Thailand}}
 * - {{flaglist|United Arab Emirates}}
 * - {{flag|Japan}}
 */
export function resolveCountryTemplate(template: string): CountryInfo | null {
  // Remove {{ and }}
  const inner = template.replace(/^\{\{|\}\}$/g, "").trim();

  // Check if it's a short code like "THA"
  if (TEMPLATE_TO_COUNTRY[inner]) {
    return TEMPLATE_TO_COUNTRY[inner];
  }

  // Check for flaglist|CountryName or flag|CountryName
  const flagMatch = inner.match(/^(?:flaglist|flag|flagicon)\|(.+?)(?:\|.*)?$/i);
  if (flagMatch) {
    const countryName = flagMatch[1].trim();

    // Handle "name=X" parameter
    const nameMatch = countryName.match(/name=([^|]+)/);
    const actualName = nameMatch ? nameMatch[1].trim() : countryName;

    if (COUNTRY_NAME_TO_INFO[actualName]) {
      return COUNTRY_NAME_TO_INFO[actualName];
    }

    // Try without extra parameters
    const cleanName = actualName.split("|")[0].trim();
    if (COUNTRY_NAME_TO_INFO[cleanName]) {
      return COUNTRY_NAME_TO_INFO[cleanName];
    }
  }

  return null;
}

/**
 * Gets country info by name.
 */
export function getCountryByName(name: string): CountryInfo | null {
  return COUNTRY_NAME_TO_INFO[name] ?? null;
}
