/**
 * Wikipedia API utilities for fetching destination data.
 */

const USER_AGENT = "TripLoom/1.0 (https://github.com/triploom; contact@triploom.com)";
const BASE_URL = "https://en.wikipedia.org";

export type WikipediaSummary = {
  title: string;
  extract: string;
  description?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
};

export type WikipediaCategory = {
  title: string;
};

/**
 * Fetches the summary for a Wikipedia page.
 * Uses the REST API which provides clean, structured data.
 */
export async function fetchWikipediaSummary(
  wikiSlug: string
): Promise<WikipediaSummary | null> {
  const url = `${BASE_URL}/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = (await response.json()) as WikipediaSummary;
    return data;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia summary for ${wikiSlug}:`, error);
    return null;
  }
}

/**
 * Fetches categories for a Wikipedia page.
 * Categories can be mapped to travel highlights.
 */
export async function fetchWikipediaCategories(
  wikiSlug: string
): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    titles: wikiSlug,
    prop: "categories",
    cllimit: "50",
    format: "json",
    formatversion: "2",
  });

  const url = `${BASE_URL}/w/api.php?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      query: {
        pages: Array<{
          categories?: Array<{ title: string }>;
        }>;
      };
    };

    const page = data.query.pages[0];
    if (!page?.categories) {
      return [];
    }

    return page.categories.map((c) =>
      c.title.replace(/^Category:/, "").toLowerCase()
    );
  } catch (error) {
    console.error(`Failed to fetch categories for ${wikiSlug}:`, error);
    return [];
  }
}

/**
 * Fetches coordinates for a Wikipedia page using the Action API.
 * Fallback when REST API doesn't include coordinates.
 */
export async function fetchWikipediaCoordinates(
  wikiSlug: string
): Promise<{ lat: number; lon: number } | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: wikiSlug,
    prop: "coordinates",
    format: "json",
    formatversion: "2",
  });

  const url = `${BASE_URL}/w/api.php?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      query: {
        pages: Array<{
          coordinates?: Array<{ lat: number; lon: number }>;
        }>;
      };
    };

    const page = data.query.pages[0];
    if (!page?.coordinates?.[0]) {
      return null;
    }

    return {
      lat: page.coordinates[0].lat,
      lon: page.coordinates[0].lon,
    };
  } catch (error) {
    console.error(`Failed to fetch coordinates for ${wikiSlug}:`, error);
    return null;
  }
}

/**
 * Fetches the original (high-resolution) image for a Wikipedia page.
 */
export async function fetchWikipediaImage(
  wikiSlug: string
): Promise<{ url: string; width: number; height: number } | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: wikiSlug,
    prop: "pageimages",
    piprop: "original",
    format: "json",
    formatversion: "2",
  });

  const url = `${BASE_URL}/w/api.php?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      query: {
        pages: Array<{
          original?: {
            source: string;
            width: number;
            height: number;
          };
        }>;
      };
    };

    const page = data.query.pages[0];
    if (!page?.original) {
      return null;
    }

    return {
      url: page.original.source,
      width: page.original.width,
      height: page.original.height,
    };
  } catch (error) {
    console.error(`Failed to fetch image for ${wikiSlug}:`, error);
    return null;
  }
}

/**
 * Sleep utility for rate limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
