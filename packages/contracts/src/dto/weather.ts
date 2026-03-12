import { z } from "zod";
import { isValidDateRange } from "../lib/date-range";

const isoDateSchema = z.string().date();
const isoDateTimeSchema = z.string().datetime({ offset: true });
const localIsoDateTimeSchema = z.string().datetime({ local: true });
const flexibleIsoDateTimeSchema = z.union([
  isoDateTimeSchema,
  localIsoDateTimeSchema,
]);

function normalizeQueryString(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value;
}

export const weatherRequestSchema = z
  .object({
    city: z.string().trim().min(2).max(120),
    startDate: isoDateSchema,
    endDate: isoDateSchema.optional(),
  })
  .refine((value) => isValidDateRange(value.startDate, value.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export const weatherRequestQuerySchema = z
  .object({
    city: z.preprocess(normalizeQueryString, z.string().trim().min(2).max(120)),
    startDate: isoDateSchema,
    endDate: isoDateSchema.optional(),
  })
  .refine((value) => isValidDateRange(value.startDate, value.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export type WeatherRequest = z.infer<typeof weatherRequestSchema>;

const resolvedWeatherLocationSchema = z.object({
  name: z.string(),
  country: z.string().nullable(),
  admin1: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
});

export const currentWeatherSchema = z.object({
  time: flexibleIsoDateTimeSchema,
  temperatureCelsius: z.number().nullable(),
  apparentTemperatureCelsius: z.number().nullable(),
  relativeHumidity: z.number().int().nullable(),
  precipitationMillimeters: z.number().nullable(),
  weatherCode: z.number().int().nullable(),
  windSpeedKmh: z.number().nullable(),
  isDay: z.boolean().nullable(),
});

export const dailyWeatherSchema = z.object({
  date: isoDateSchema,
  weatherCode: z.number().int().nullable(),
  temperatureMaxCelsius: z.number().nullable(),
  temperatureMinCelsius: z.number().nullable(),
  apparentTemperatureMaxCelsius: z.number().nullable(),
  apparentTemperatureMinCelsius: z.number().nullable(),
  precipitationProbabilityMax: z.number().int().nullable(),
  precipitationSumMillimeters: z.number().nullable(),
  windSpeedMaxKmh: z.number().nullable(),
  sunrise: flexibleIsoDateTimeSchema.nullable(),
  sunset: flexibleIsoDateTimeSchema.nullable(),
});

const hourlyWeatherEntrySchema = z.object({
  time: flexibleIsoDateTimeSchema,
  temperatureCelsius: z.number().nullable(),
  apparentTemperatureCelsius: z.number().nullable(),
  relativeHumidity: z.number().int().nullable(),
  precipitationProbability: z.number().int().nullable(),
  precipitationMillimeters: z.number().nullable(),
  weatherCode: z.number().int().nullable(),
  windSpeedKmh: z.number().nullable(),
  isDay: z.boolean().nullable(),
});

export const hourlyWeatherDaySchema = z.object({
  date: isoDateSchema,
  entries: z.array(hourlyWeatherEntrySchema),
});

export const weatherResponseSchema = z.object({
  location: resolvedWeatherLocationSchema,
  requestedStartDate: isoDateSchema,
  requestedEndDate: isoDateSchema,
  forecastWindowStart: isoDateSchema,
  forecastWindowEnd: isoDateSchema,
  isSingleDay: z.boolean(),
  current: currentWeatherSchema.nullable(),
  days: z.array(dailyWeatherSchema),
  hourlyByDay: z.array(hourlyWeatherDaySchema),
});

export type WeatherResponseDTO = z.infer<typeof weatherResponseSchema>;
