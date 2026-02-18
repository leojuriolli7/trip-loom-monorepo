/**
 * Image fetching utilities using Pexels and Unsplash APIs.
 */

export type ImageResult = {
  url: string;
  width: number;
  height: number;
  attribution: string;
  source: "wikipedia" | "pexels" | "unsplash";
};

// Rate limiting state
let pexelsRequestCount = 0;
let pexelsResetTime = Date.now() + 3600000; // 1 hour from now

/**
 * Fetches an image from Pexels API.
 * Rate limit: 200 requests/hour
 */
export async function fetchPexelsImage(
  query: string,
  apiKey: string
): Promise<ImageResult | null> {
  // Check rate limit
  if (Date.now() > pexelsResetTime) {
    pexelsRequestCount = 0;
    pexelsResetTime = Date.now() + 3600000;
  }

  if (pexelsRequestCount >= 190) {
    // Leave buffer
    console.warn("Pexels rate limit approaching, skipping request");
    return null;
  }

  const params = new URLSearchParams({
    query: `${query} travel cityscape`,
    per_page: "1",
    orientation: "landscape",
  });

  const url = `https://api.pexels.com/v1/search?${params}`;

  try {
    pexelsRequestCount++;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Pexels rate limited");
        return null;
      }
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      photos: Array<{
        src: {
          original: string;
          large2x: string;
        };
        width: number;
        height: number;
        photographer: string;
      }>;
    };

    if (data.photos.length === 0) {
      return null;
    }

    const photo = data.photos[0];
    return {
      url: photo.src.large2x || photo.src.original,
      width: photo.width,
      height: photo.height,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      source: "pexels",
    };
  } catch (error) {
    console.error(`Failed to fetch Pexels image for "${query}":`, error);
    return null;
  }
}

/**
 * Fetches an image from Unsplash API.
 * Rate limit: 50 requests/hour
 */
export async function fetchUnsplashImage(
  query: string,
  accessKey: string
): Promise<ImageResult | null> {
  const params = new URLSearchParams({
    query: `${query} travel`,
    per_page: "1",
    orientation: "landscape",
  });

  const url = `https://api.unsplash.com/search/photos?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Unsplash rate limited");
        return null;
      }
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: Array<{
        urls: {
          raw: string;
          full: string;
          regular: string;
        };
        width: number;
        height: number;
        user: {
          name: string;
        };
      }>;
    };

    if (data.results.length === 0) {
      return null;
    }

    const photo = data.results[0];
    return {
      url: photo.urls.regular,
      width: photo.width,
      height: photo.height,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      source: "unsplash",
    };
  } catch (error) {
    console.error(`Failed to fetch Unsplash image for "${query}":`, error);
    return null;
  }
}

/**
 * Converts Wikipedia image info to ImageResult.
 */
export function wikiImageToResult(
  wikiImage: { url: string; width: number; height: number } | null
): ImageResult | null {
  if (!wikiImage) return null;

  // Filter out low quality images
  if (wikiImage.width < 800) {
    return null;
  }

  return {
    url: wikiImage.url,
    width: wikiImage.width,
    height: wikiImage.height,
    attribution: "Wikimedia Commons",
    source: "wikipedia",
  };
}

/**
 * Fetches an image with fallback chain: Wikipedia → Pexels → Unsplash.
 */
export async function fetchImageWithFallback(
  cityName: string,
  wikiImage: { url: string; width: number; height: number } | null,
  pexelsKey?: string,
  unsplashKey?: string
): Promise<ImageResult | null> {
  // Try Wikipedia first (already fetched)
  const wikiResult = wikiImageToResult(wikiImage);
  if (wikiResult) {
    return wikiResult;
  }

  // Try Pexels
  if (pexelsKey) {
    const pexelsResult = await fetchPexelsImage(cityName, pexelsKey);
    if (pexelsResult) {
      return pexelsResult;
    }
  }

  // Try Unsplash as last resort
  if (unsplashKey) {
    const unsplashResult = await fetchUnsplashImage(cityName, unsplashKey);
    if (unsplashResult) {
      return unsplashResult;
    }
  }

  return null;
}
