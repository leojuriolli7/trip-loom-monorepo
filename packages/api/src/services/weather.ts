import {
  currentWeatherSchema,
  dailyWeatherSchema,
  hourlyWeatherDaySchema,
  type WeatherRequest,
  type WeatherResponseDTO,
} from "@trip-loom/contracts/dto/weather";
import { BadRequestError } from "../errors";
import { weatherProvider } from "../lib/weather/provider";

const MAX_FORECAST_DAYS = 16;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeDateRange(input: WeatherRequest): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: input.startDate,
    endDate: input.endDate ?? input.startDate,
  };
}

function validateForecastWindow(
  startDate: string,
  endDate: string,
): {
  forecastWindowStart: string;
  forecastWindowEnd: string;
} {
  const today = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const forecastWindowStart = toIsoDate(startOfTodayUtc);
  const forecastWindowEnd = toIsoDate(
    addDays(startOfTodayUtc, MAX_FORECAST_DAYS - 1),
  );

  if (endDate < forecastWindowStart || startDate > forecastWindowEnd) {
    throw new BadRequestError(
      `Requested dates must overlap the forecast window ${forecastWindowStart} to ${forecastWindowEnd}`,
    );
  }

  return { forecastWindowStart, forecastWindowEnd };
}

function toBoolean(value: number | null | undefined): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value === 1;
}

export async function getWeatherForecast(
  input: WeatherRequest,
): Promise<WeatherResponseDTO> {
  const { startDate: rawStart, endDate: rawEnd } = normalizeDateRange(input);
  const { forecastWindowStart, forecastWindowEnd } = validateForecastWindow(
    rawStart,
    rawEnd,
  );

  // Clamp requested dates to the forecast window so Open-Meteo
  // doesn't reject out-of-range dates with a 400.
  const startDate =
    rawStart < forecastWindowStart ? forecastWindowStart : rawStart;
  const endDate = rawEnd > forecastWindowEnd ? forecastWindowEnd : rawEnd;

  const resolvedLocation = await weatherProvider.geocodeLocation({
    query: input.city,
  });

  const forecast = await weatherProvider.getForecast({
    latitude: resolvedLocation.latitude,
    longitude: resolvedLocation.longitude,
    startDate,
    endDate,
    timezone: resolvedLocation.timezone,
  });

  const days = forecast.daily.time.map((date, index) =>
    dailyWeatherSchema.parse({
      date,
      weatherCode: forecast.daily.weather_code[index] ?? null,
      temperatureMaxCelsius: forecast.daily.temperature_2m_max[index] ?? null,
      temperatureMinCelsius: forecast.daily.temperature_2m_min[index] ?? null,
      apparentTemperatureMaxCelsius:
        forecast.daily.apparent_temperature_max[index] ?? null,
      apparentTemperatureMinCelsius:
        forecast.daily.apparent_temperature_min[index] ?? null,
      precipitationProbabilityMax:
        forecast.daily.precipitation_probability_max[index] ?? null,
      precipitationSumMillimeters:
        forecast.daily.precipitation_sum[index] ?? null,
      windSpeedMaxKmh: forecast.daily.wind_speed_10m_max[index] ?? null,
      sunrise: forecast.daily.sunrise[index] ?? null,
      sunset: forecast.daily.sunset[index] ?? null,
    }),
  );

  const hourlyByDayMap = new Map<string, Array<Record<string, unknown>>>();
  for (let index = 0; index < forecast.hourly.time.length; index += 1) {
    const time = forecast.hourly.time[index];
    const date = time?.slice(0, 10);
    if (!date) {
      continue;
    }

    const entries = hourlyByDayMap.get(date) ?? [];
    entries.push({
      time,
      temperatureCelsius: forecast.hourly.temperature_2m[index] ?? null,
      apparentTemperatureCelsius:
        forecast.hourly.apparent_temperature[index] ?? null,
      relativeHumidity: forecast.hourly.relative_humidity_2m[index] ?? null,
      precipitationProbability:
        forecast.hourly.precipitation_probability[index] ?? null,
      precipitationMillimeters: forecast.hourly.precipitation[index] ?? null,
      weatherCode: forecast.hourly.weather_code[index] ?? null,
      windSpeedKmh: forecast.hourly.wind_speed_10m[index] ?? null,
      isDay: toBoolean(forecast.hourly.is_day[index]),
    });
    hourlyByDayMap.set(date, entries);
  }

  const hourlyByDay = days.map((day) =>
    hourlyWeatherDaySchema.parse({
      date: day.date,
      entries: (hourlyByDayMap.get(day.date) ?? []).map((entry) => entry),
    }),
  );

  return {
    location: {
      name: resolvedLocation.name,
      country: resolvedLocation.country,
      admin1: resolvedLocation.admin1,
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      timezone:
        forecast.timezone === "auto"
          ? resolvedLocation.timezone
          : forecast.timezone,
    },
    requestedStartDate: rawStart,
    requestedEndDate: rawEnd,
    forecastWindowStart,
    forecastWindowEnd,
    isSingleDay: startDate === endDate,
    current: forecast.current
      ? currentWeatherSchema.parse({
          time: forecast.current.time,
          temperatureCelsius: forecast.current.temperature_2m,
          apparentTemperatureCelsius: forecast.current.apparent_temperature,
          relativeHumidity: forecast.current.relative_humidity_2m,
          precipitationMillimeters: forecast.current.precipitation,
          weatherCode: forecast.current.weather_code,
          windSpeedKmh: forecast.current.wind_speed_10m,
          isDay: toBoolean(forecast.current.is_day),
        })
      : null,
    days,
    hourlyByDay,
  };
}
