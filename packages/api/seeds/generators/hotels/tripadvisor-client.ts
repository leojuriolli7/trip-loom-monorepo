/**
 * TripAdvisor Content API v1 client.
 * Rate-limited to ~5 calls/second to stay well under 50/sec limit.
 * Includes retry logic with exponential backoff for 429 errors.
 */

const BASE_URL = "https://api.content.tripadvisor.com/api/v1";

// Rate limiting: 200ms between calls = 5 calls/sec
const RATE_LIMIT_MS = 200;
let lastCallTime = 0;

// Retry config
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000; // Start with 2 seconds

async function rateLimitedFetch(
  url: string,
  retries = MAX_RETRIES
): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - timeSinceLastCall);
  }

  lastCallTime = Date.now();
  const response = await fetch(url);

  // Handle rate limiting with exponential backoff
  if (response.status === 429 && retries > 0) {
    const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, MAX_RETRIES - retries);
    console.log(
      `  Rate limited (429), waiting ${backoffMs / 1000}s before retry (${retries} retries left)...`
    );
    await sleep(backoffMs);
    return rateLimitedFetch(url, retries - 1);
  }

  return response;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SearchResult = {
  location_id: string;
  name: string;
  distance: string;
  rating: string;
  bearing: string;
  address_obj: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
};

export type SearchResponse = {
  data: SearchResult[];
};

export type HotelDetails = {
  location_id: string;
  name: string;
  description?: string;
  web_url?: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
  ancestors?: Array<{
    level: string;
    name: string;
    location_id: string;
  }>;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  email?: string;
  phone?: string;
  website?: string;
  write_review?: string;
  ranking_data?: {
    geo_location_id: string;
    ranking_string: string;
    geo_location_name: string;
    ranking_out_of: string;
    ranking: string;
  };
  rating?: string;
  rating_image_url?: string;
  num_reviews?: string;
  review_rating_count?: Record<string, string>;
  photo_count?: string;
  see_all_photos?: string;
  price_level?: string;
  amenities?: string[];
  styles?: string[];
  brand?: string;
  category?: {
    name: string;
    localized_name: string;
  };
  subcategory?: Array<{
    name: string;
    localized_name: string;
  }>;
  groups?: Array<{
    name: string;
    localized_name: string;
    categories: Array<{
      name: string;
      localized_name: string;
    }>;
  }>;
  neighborhood_info?: Array<{
    location_id: string;
    name: string;
  }>;
  trip_types?: Array<{
    name: string;
    localized_name: string;
    value: string;
  }>;
  awards?: Array<{
    award_type: string;
    year: string;
    images: {
      small: string;
      large: string;
    };
    categories: string[];
    display_name: string;
  }>;
};

export type DetailsResponse = {
  location_id: string;
  name: string;
  description?: string;
  web_url?: string;
  address_obj?: HotelDetails["address_obj"];
  ancestors?: HotelDetails["ancestors"];
  latitude?: string;
  longitude?: string;
  timezone?: string;
  email?: string;
  phone?: string;
  website?: string;
  write_review?: string;
  ranking_data?: HotelDetails["ranking_data"];
  rating?: string;
  rating_image_url?: string;
  num_reviews?: string;
  review_rating_count?: Record<string, string>;
  photo_count?: string;
  see_all_photos?: string;
  price_level?: string;
  amenities?: string[];
  styles?: string[];
  brand?: string;
  category?: HotelDetails["category"];
  subcategory?: HotelDetails["subcategory"];
  groups?: HotelDetails["groups"];
  neighborhood_info?: HotelDetails["neighborhood_info"];
  trip_types?: HotelDetails["trip_types"];
  awards?: HotelDetails["awards"];
};

/**
 * Search for hotels in a location.
 * This endpoint is FREE and doesn't count against the 5000 limit.
 */
export async function searchHotels(
  apiKey: string,
  query: string,
  options?: {
    latLong?: string;
    radius?: number;
    radiusUnit?: "km" | "mi";
  }
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    searchQuery: query,
    category: "hotels",
    language: "en",
    key: apiKey,
  });

  if (options?.latLong) {
    params.set("latLong", options.latLong);
  }
  if (options?.radius) {
    params.set("radius", options.radius.toString());
  }
  if (options?.radiusUnit) {
    params.set("radiusUnit", options.radiusUnit);
  }

  const url = `${BASE_URL}/location/search?${params.toString()}`;
  const response = await rateLimitedFetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TripAdvisor search failed: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Get detailed information about a hotel.
 * This counts against the 5000/month free tier.
 */
export async function getHotelDetails(
  apiKey: string,
  locationId: string
): Promise<DetailsResponse> {
  const params = new URLSearchParams({
    language: "en",
    currency: "USD",
    key: apiKey,
  });

  const url = `${BASE_URL}/location/${locationId}/details?${params.toString()}`;
  const response = await rateLimitedFetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TripAdvisor details failed: ${response.status} ${text}`);
  }

  return response.json();
}
