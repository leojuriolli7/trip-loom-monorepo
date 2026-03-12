import type { WeatherResponseDTO } from "@trip-loom/contracts/dto/weather";
import {
  getWeatherConditionVariant,
  type WeatherDayPhase,
  weatherVisualRegistry,
} from "./weather-registry";

/**
 * Formats an ISO date string into a compact display label for the card header.
 */
export function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

/**
 * Extracts the HH:MM portion from an ISO-like datetime string.
 */
export function formatClock(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.slice(11, 16);
}

/**
 * Formats a Celsius temperature for compact UI display.
 */
export function formatTemperature(value: number | null | undefined) {
  if (value == null) {
    return "--";
  }

  return `${Math.round(value)}°`;
}

/**
 * Formats a numeric precipitation probability as a percentage string.
 */
export function formatPercent(value: number | null | undefined) {
  if (value == null) {
    return "--";
  }

  return `${Math.round(value)}%`;
}

/**
 * Formats wind speed in kilometers per hour for summary metrics.
 */
export function formatWind(value: number | null | undefined) {
  if (value == null) {
    return "--";
  }

  return `${Math.round(value)} km/h`;
}

/**
 * Chooses whether the card should render a day or night visual treatment.
 */
export function getDisplayPhase(result: WeatherResponseDTO): WeatherDayPhase {
  if (
    result.requestedStartDate === result.forecastWindowStart &&
    result.current
  ) {
    return result.current.isDay ? "day" : "night";
  }

  return "day";
}

/**
 * Derives the primary visual and summary payload used by the weather card.
 */
export function getDisplayPayload(result: WeatherResponseDTO) {
  const day = result.days[0] ?? null;
  const phase = getDisplayPhase(result);

  const weatherCode =
    result.requestedStartDate === result.forecastWindowStart && result.current
      ? result.current.weatherCode
      : day?.weatherCode;
  const variant = getWeatherConditionVariant(weatherCode);
  const visual = weatherVisualRegistry[variant];

  return {
    day,
    phase,
    variant,
    visual,
    iconComponent: visual.iconByPhase[phase],
    heroImageSrc: visual.imageByPhase[phase],
    primaryTemperature:
      result.requestedStartDate === result.forecastWindowStart && result.current
        ? formatTemperature(result.current.temperatureCelsius)
        : formatTemperature(day?.temperatureMaxCelsius),
  };
}
