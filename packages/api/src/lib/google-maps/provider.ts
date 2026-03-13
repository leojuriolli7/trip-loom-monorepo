import type {
  GetPlaceDetailsInput,
  GooglePlaceDetails,
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

export interface GoogleMapsProvider {
  searchPlaces(input: SearchPlacesInput): Promise<GooglePlaceSummary[]>;
  getPlaceDetails(input: GetPlaceDetailsInput): Promise<GooglePlaceDetails>;
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
};
