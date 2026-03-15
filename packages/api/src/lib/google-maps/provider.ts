import type {
  GetPlaceDetailsInput,
  GooglePlaceDetails,
  GooglePlaceEnrichedDetails,
  GooglePlacePhoto,
  GooglePlaceReview,
  GooglePlaceSummary,
  SearchPlacesInput,
} from "@trip-loom/contracts/dto";
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from "../../errors";

type GooglePlaceResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  editorialSummary?: { text?: string } | string;
  reviewSummary?: { text?: string | { text?: string } } | string;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    publishTime?: string;
    relativePublishTimeDescription?: string;
    authorAttribution?: {
      displayName?: string;
      uri?: string;
    };
  }>;
  photos?: GooglePlacePhotoResource[];
};

type GooglePlacePhotoResource = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<{
    displayName?: string;
    uri?: string;
  }>;
};

type GooglePlacePhotoMediaResponse = {
  photoUri?: string;
};

type SearchPlacesResponse = {
  places?: GooglePlaceResponse[];
};

const DEFAULT_BASE_URL = "https://places.googleapis.com/v1";
const DEFAULT_TIMEOUT_MS = 8_000;

function getGoogleMapsApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ServiceUnavailableError(
      "Google Maps provider is not configured on the server",
    );
  }

  return apiKey;
}

function getTimeoutMs(): number {
  const raw = process.env.GOOGLE_MAPS_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function normalizePlaceSummary(place: GooglePlaceResponse): GooglePlaceSummary {
  return {
    placeId: place.id ?? "",
    displayName: place.displayName?.text ?? "Unknown place",
    formattedAddress: place.formattedAddress ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  };
}

function normalizePlaceDetails(place: GooglePlaceResponse): GooglePlaceDetails {
  return {
    ...normalizePlaceSummary(place),
    primaryType: place.primaryType ?? null,
  };
}

function normalizeReview(
  review: NonNullable<GooglePlaceResponse["reviews"]>[number],
): GooglePlaceReview {
  return {
    rating: review.rating ?? null,
    text: review.text?.text ?? null,
    publishTime: review.publishTime ?? null,
    relativePublishTimeDescription:
      review.relativePublishTimeDescription ?? null,
    authorName: review.authorAttribution?.displayName ?? null,
    authorUrl: review.authorAttribution?.uri ?? null,
  };
}

/** Google returns some fields as `string`, `{ text: string }`, or `{ text: { text: string } }`. */
function extractText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;

  if (typeof value === "object" && "text" in value) {
    const inner = (value as Record<string, unknown>).text;
    if (typeof inner === "string") return inner;

    if (inner != null && typeof inner === "object" && "text" in inner) {
      const deepText = (inner as Record<string, unknown>).text;
      if (typeof deepText === "string") return deepText;
    }
  }

  return null;
}

function normalizeEnrichedPlaceDetails(
  place: GooglePlaceResponse,
  photos: GooglePlacePhoto[],
): GooglePlaceEnrichedDetails {
  return {
    ...normalizePlaceDetails(place),
    websiteUrl: place.websiteUri ?? null,
    phoneNumber: place.internationalPhoneNumber ?? null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    businessStatus: place.businessStatus ?? null,
    isOpenNow: place.currentOpeningHours?.openNow ?? null,
    weekdayDescriptions: place.currentOpeningHours?.weekdayDescriptions ?? [],
    editorialSummary: extractText(place.editorialSummary),
    reviewSummary: extractText(place.reviewSummary),
    photos,
    reviews: (place.reviews ?? []).slice(0, 3).map(normalizeReview),
  };
}

async function fetchGoogleMaps<T>(
  path: string,
  init: RequestInit & { fieldMask: string },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getGoogleMapsApiKey(),
        "X-Goog-FieldMask": init.fieldMask,
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 400) {
      throw new BadRequestError("Invalid Google Maps place search request");
    }

    if (response.status === 404) {
      throw new NotFoundError("Google Maps place was not found");
    }

    if (response.status === 429) {
      throw new TooManyRequestsError(
        "Google Maps provider is temporarily rate limited",
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableError(
        `Google Maps request failed with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError ||
      error instanceof TooManyRequestsError ||
      error instanceof ServiceUnavailableError
    ) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ServiceUnavailableError(
        "Google Maps provider request timed out",
      );
    }

    throw new ServiceUnavailableError("Google Maps provider request failed");
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGooglePhotoMedia(
  photoName: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const encodedPhotoName = photoName
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    const response = await fetch(
      `${DEFAULT_BASE_URL}/${encodedPhotoName}/media?maxWidthPx=1200&skipHttpRedirect=true`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          "X-Goog-Api-Key": getGoogleMapsApiKey(),
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GooglePlacePhotoMediaResponse;
    return data.photoUri ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolvePhotos(
  photos: GooglePlacePhotoResource[] | undefined,
  limit: number,
): Promise<GooglePlacePhoto[]> {
  const photoResources = (photos ?? [])
    .filter((photo) => photo.name)
    .slice(0, limit);

  const resolved = await Promise.all(
    photoResources.map(async (photo) => {
      const url = await fetchGooglePhotoMedia(photo.name!);

      if (!url) {
        return null;
      }

      const firstAttribution = photo.authorAttributions?.[0];

      return {
        url,
        width: photo.widthPx ?? null,
        height: photo.heightPx ?? null,
        authorName: firstAttribution?.displayName ?? null,
        authorUrl: firstAttribution?.uri ?? null,
      } satisfies GooglePlacePhoto;
    }),
  );

  return resolved.filter((photo): photo is GooglePlacePhoto => photo !== null);
}

export interface GoogleMapsProvider {
  searchPlaces(input: SearchPlacesInput): Promise<GooglePlaceSummary[]>;
  getPlaceDetails(input: GetPlaceDetailsInput): Promise<GooglePlaceDetails>;
  getEnrichedPlaceDetails(
    input: GetPlaceDetailsInput,
  ): Promise<GooglePlaceEnrichedDetails>;
  getPlaceImageUrl(placeId: string): Promise<string | null>;
}

export const googleMapsProvider: GoogleMapsProvider = {
  async searchPlaces(input) {
    const body: Record<string, unknown> = {
      textQuery: input.destination
        ? `${input.query} in ${input.destination}`
        : input.query,
      pageSize: input.pageSize,
    };

    if (input.languageCode) {
      body.languageCode = input.languageCode;
    }

    if (input.regionCode) {
      body.regionCode = input.regionCode;
    }

    if (input.latitude !== undefined && input.longitude !== undefined) {
      body.locationBias = {
        circle: {
          center: {
            latitude: input.latitude,
            longitude: input.longitude,
          },
          radius: input.radiusMeters ?? 10_000,
        },
      };
    }

    const result = await fetchGoogleMaps<SearchPlacesResponse>(
      "/places:searchText",
      {
        method: "POST",
        body: JSON.stringify(body),
        fieldMask:
          "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.location",
      },
    );

    return (result.places ?? [])
      .map(normalizePlaceSummary)
      .filter((place) => place.placeId.length > 0);
  },

  async getPlaceDetails(input) {
    const params = new URLSearchParams();

    if (input.languageCode) {
      params.set("languageCode", input.languageCode);
    }

    if (input.regionCode) {
      params.set("regionCode", input.regionCode);
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    const result = await fetchGoogleMaps<GooglePlaceResponse>(
      `/places/${input.placeId}${suffix}`,
      {
        method: "GET",
        fieldMask:
          "id,displayName,formattedAddress,googleMapsUri,location,primaryType",
      },
    );

    if (!result.id) {
      throw new NotFoundError(
        `Google Maps place not found for ID ${input.placeId}`,
      );
    }

    return normalizePlaceDetails(result);
  },

  async getEnrichedPlaceDetails(input) {
    const params = new URLSearchParams();

    if (input.languageCode) {
      params.set("languageCode", input.languageCode);
    }

    if (input.regionCode) {
      params.set("regionCode", input.regionCode);
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    const result = await fetchGoogleMaps<GooglePlaceResponse>(
      `/places/${input.placeId}${suffix}`,
      {
        method: "GET",
        fieldMask:
          "id,displayName,formattedAddress,googleMapsUri,location,primaryType,websiteUri,internationalPhoneNumber,rating,userRatingCount,businessStatus,currentOpeningHours,editorialSummary,reviewSummary,reviews,photos",
      },
    );

    if (!result.id) {
      throw new NotFoundError(
        `Google Maps place not found for ID ${input.placeId}`,
      );
    }

    const photos = await resolvePhotos(result.photos, 6);

    return normalizeEnrichedPlaceDetails(result, photos);
  },

  async getPlaceImageUrl(placeId) {
    try {
      const result = await fetchGoogleMaps<GooglePlaceResponse>(
        `/places/${placeId}`,
        {
          method: "GET",
          fieldMask: "id,photos",
        },
      );

      const photos = await resolvePhotos(result.photos, 1);
      return photos[0]?.url ?? null;
    } catch {
      return null;
    }
  },
};
