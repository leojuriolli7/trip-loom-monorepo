import {
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
} from "../../errors";

export type GeocodedLocation = {
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type OpenMeteoForecast = {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number | null;
    apparent_temperature: number | null;
    relative_humidity_2m: number | null;
    precipitation: number | null;
    weather_code: number | null;
    wind_speed_10m: number | null;
    is_day: number | null;
  } | null;
  daily: {
    time: string[];
    weather_code: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    temperature_2m_min: Array<number | null>;
    apparent_temperature_max: Array<number | null>;
    apparent_temperature_min: Array<number | null>;
    precipitation_probability_max: Array<number | null>;
    precipitation_sum: Array<number | null>;
    wind_speed_10m_max: Array<number | null>;
    sunrise: Array<string | null>;
    sunset: Array<string | null>;
  };
  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
    apparent_temperature: Array<number | null>;
    relative_humidity_2m: Array<number | null>;
    precipitation_probability: Array<number | null>;
    precipitation: Array<number | null>;
    weather_code: Array<number | null>;
    wind_speed_10m: Array<number | null>;
    is_day: Array<number | null>;
  };
};

const DEFAULT_OPEN_METEO_BASE_URL = "https://api.open-meteo.com";
const DEFAULT_OPEN_METEO_GEOCODING_BASE_URL =
  "https://geocoding-api.open-meteo.com";
const DEFAULT_TIMEOUT_MS = 8_000;

function getTimeoutMs(): number {
  const raw = process.env.WEATHER_REQUEST_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (response.status === 429) {
      throw new TooManyRequestsError(
        "Weather provider is temporarily rate limited",
      );
    }

    if (!response.ok) {
      throw new Error(
        `Open-Meteo request failed with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BadRequestError("Weather provider request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export interface WeatherProvider {
  geocodeLocation(input: { query: string }): Promise<GeocodedLocation>;
  getForecast(input: {
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    timezone?: string;
  }): Promise<OpenMeteoForecast>;
}

export const weatherProvider: WeatherProvider = {
  async geocodeLocation(input) {
    const baseUrl =
      process.env.OPEN_METEO_GEOCODING_BASE_URL ??
      DEFAULT_OPEN_METEO_GEOCODING_BASE_URL;

    const url = new URL("/v1/search", baseUrl);
    url.searchParams.set("name", input.query);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const result = await fetchJson<{
      results?: Array<{
        name: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
        timezone: string;
      }>;
    }>(url);

    const match = result.results?.[0];
    if (!match) {
      throw new NotFoundError(
        `Could not find a weather location for "${input.query}"`,
      );
    }

    return {
      name: match.name,
      country: match.country ?? null,
      admin1: match.admin1 ?? null,
      latitude: match.latitude,
      longitude: match.longitude,
      timezone: match.timezone,
    };
  },

  async getForecast(input) {
    const baseUrl =
      process.env.OPEN_METEO_BASE_URL ?? DEFAULT_OPEN_METEO_BASE_URL;
    const url = new URL("/v1/forecast", baseUrl);
    url.searchParams.set("latitude", String(input.latitude));
    url.searchParams.set("longitude", String(input.longitude));
    url.searchParams.set("timezone", input.timezone ?? "auto");
    url.searchParams.set("start_date", input.startDate);
    url.searchParams.set("end_date", input.endDate);
    url.searchParams.set(
      "current",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
        "is_day",
      ].join(","),
    );
    url.searchParams.set(
      "daily",
      [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "apparent_temperature_max",
        "apparent_temperature_min",
        "precipitation_probability_max",
        "precipitation_sum",
        "wind_speed_10m_max",
        "sunrise",
        "sunset",
      ].join(","),
    );
    url.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation_probability",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
        "is_day",
      ].join(","),
    );

    return fetchJson<OpenMeteoForecast>(url);
  },
};
