import { afterAll, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { db } from "../db";
import { user } from "../db/schema";
import { weatherRoutes } from "../routes/weather";
import { weatherProvider } from "../lib/weather/provider";
import { NotFoundError } from "../errors";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
} from "./harness";

const ctx = createTestContext("weather");
const app = createTestApp().use(weatherRoutes);
const request = createJsonRequester(app);
const authMock = createHeaderAuthMock(ctx.prefix);

const geocodeSpy = spyOn(weatherProvider, "geocodeLocation");
const forecastSpy = spyOn(weatherProvider, "getForecast");

const testUserId = `${ctx.prefix}user_weather`;

function futureIsoDate(daysAhead: number): string {
  const now = new Date();
  const value = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead),
  );
  return value.toISOString().slice(0, 10);
}

function buildWeatherPath(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  return `/api/weather/forecast?${query.toString()}`;
}

describe("Weather API", () => {
  beforeAll(async () => {
    authMock.enable();
    await ctx.cleanup();
    await db.insert(user).values({
      id: testUserId,
      name: "Weather Test User",
      email: `${testUserId}@example.test`,
      emailVerified: true,
    });
  });

  afterAll(async () => {
    authMock.restore();
    geocodeSpy.mockRestore();
    forecastSpy.mockRestore();
    await ctx.cleanup();
  });

  beforeEach(() => {
    geocodeSpy.mockReset();
    forecastSpy.mockReset();
  });

  it("returns a single-day forecast from a city", async () => {
    const startDate = futureIsoDate(1);

    geocodeSpy.mockResolvedValue({
      name: "Recife",
      country: "Brazil",
      admin1: "Pernambuco",
      latitude: -8.05389,
      longitude: -34.88111,
      timezone: "America/Recife",
    });
    forecastSpy.mockResolvedValue({
      timezone: "America/Recife",
      current: {
        time: `${startDate}T12:00:00-03:00`,
        temperature_2m: 29,
        apparent_temperature: 32,
        relative_humidity_2m: 68,
        precipitation: 0,
        weather_code: 1,
        wind_speed_10m: 14,
        is_day: 1,
      },
      daily: {
        time: [startDate],
        weather_code: [1],
        temperature_2m_max: [31],
        temperature_2m_min: [25],
        apparent_temperature_max: [35],
        apparent_temperature_min: [27],
        precipitation_probability_max: [15],
        precipitation_sum: [0.2],
        wind_speed_10m_max: [20],
        sunrise: [`${startDate}T05:08:00`],
        sunset: [`${startDate}T17:12:00`],
      },
      hourly: {
        time: [`${startDate}T09:00:00-03:00`, `${startDate}T12:00:00-03:00`],
        temperature_2m: [27, 29],
        apparent_temperature: [29, 32],
        relative_humidity_2m: [74, 68],
        precipitation_probability: [10, 15],
        precipitation: [0, 0],
        weather_code: [1, 1],
        wind_speed_10m: [12, 14],
        is_day: [1, 1],
      },
    });

    const { res, body } = await request.get(
      buildWeatherPath({
        city: "Recife",
        startDate,
      }),
      testUserId,
    );

    expect(res.status).toBe(200);
    expect(body.location).toMatchObject({
      name: "Recife",
      country: "Brazil",
    });
    expect(body.isSingleDay).toBe(true);
    expect(body.days).toHaveLength(1);
    expect(body.hourlyByDay[0]?.entries).toHaveLength(2);
    expect(geocodeSpy).toHaveBeenCalledTimes(1);
    expect(forecastSpy).toHaveBeenCalledWith({
      latitude: -8.05389,
      longitude: -34.88111,
      startDate,
      endDate: startDate,
      timezone: "America/Recife",
    });
  });

  it("returns a multi-day forecast from a city", async () => {
    const startDate = futureIsoDate(2);
    const endDate = futureIsoDate(4);

    geocodeSpy.mockResolvedValue({
      name: "Paris",
      country: "France",
      admin1: "Ile-de-France",
      latitude: 48.8566,
      longitude: 2.3522,
      timezone: "Europe/Paris",
    });
    forecastSpy.mockResolvedValue({
      timezone: "Europe/Paris",
      current: null,
      daily: {
        time: [startDate, futureIsoDate(3), endDate],
        weather_code: [2, 3, 61],
        temperature_2m_max: [18, 17, 16],
        temperature_2m_min: [11, 10, 9],
        apparent_temperature_max: [18, 17, 15],
        apparent_temperature_min: [10, 9, 8],
        precipitation_probability_max: [10, 20, 70],
        precipitation_sum: [0, 0.3, 4.1],
        wind_speed_10m_max: [15, 18, 22],
        sunrise: [
          `${startDate}T06:50:00`,
          `${futureIsoDate(3)}T06:48:00`,
          `${endDate}T06:47:00`,
        ],
        sunset: [
          `${startDate}T18:31:00`,
          `${futureIsoDate(3)}T18:32:00`,
          `${endDate}T18:33:00`,
        ],
      },
      hourly: {
        time: [
          `${startDate}T09:00:00+01:00`,
          `${startDate}T12:00:00+01:00`,
          `${futureIsoDate(3)}T09:00:00+01:00`,
          `${endDate}T09:00:00+01:00`,
        ],
        temperature_2m: [14, 18, 15, 12],
        apparent_temperature: [13, 18, 15, 10],
        relative_humidity_2m: [62, 55, 66, 81],
        precipitation_probability: [5, 10, 20, 75],
        precipitation: [0, 0, 0.1, 1.2],
        weather_code: [2, 2, 3, 61],
        wind_speed_10m: [10, 13, 15, 20],
        is_day: [1, 1, 1, 1],
      },
    });

    const { res, body } = await request.get(
      buildWeatherPath({
        city: "Paris",
        startDate,
        endDate,
      }),
      testUserId,
    );

    expect(res.status).toBe(200);
    expect(body.location).toMatchObject({
      name: "Paris",
      timezone: "Europe/Paris",
    });
    expect(body.isSingleDay).toBe(false);
    expect(body.days).toHaveLength(3);
    expect(body.hourlyByDay).toHaveLength(3);
    expect(geocodeSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects requests outside the forecast window", async () => {
    const { res, body } = await request.get(
      buildWeatherPath({
        city: "Tokyo",
        startDate: futureIsoDate(30),
      }),
      testUserId,
    );

    expect(res.status).toBe(400);
    expect(body.message).toContain("forecast window");
    expect(geocodeSpy).not.toHaveBeenCalled();
    expect(forecastSpy).not.toHaveBeenCalled();
  });

  it("returns not found when geocoding cannot resolve the city", async () => {
    const startDate = futureIsoDate(1);
    geocodeSpy.mockRejectedValueOnce(
      new NotFoundError('Could not find a weather location for "Atlantis"'),
    );

    const { res, body } = await request.get(
      buildWeatherPath({
        city: "Atlantis",
        startDate,
      }),
      testUserId,
    );

    expect(res.status).toBe(404);
    expect(body.message).toContain("Atlantis");
    expect(forecastSpy).not.toHaveBeenCalled();
  });

  it("accepts Open-Meteo local datetime strings without offsets", async () => {
    const startDate = futureIsoDate(1);

    geocodeSpy.mockResolvedValue({
      name: "Recife",
      country: "Brazil",
      admin1: "Pernambuco",
      latitude: -8.05389,
      longitude: -34.88111,
      timezone: "America/Recife",
    });
    forecastSpy.mockResolvedValue({
      timezone: "America/Recife",
      current: {
        time: `${startDate}T12:00`,
        temperature_2m: 29,
        apparent_temperature: 32,
        relative_humidity_2m: 68,
        precipitation: 0,
        weather_code: 1,
        wind_speed_10m: 14,
        is_day: 1,
      },
      daily: {
        time: [startDate],
        weather_code: [1],
        temperature_2m_max: [31],
        temperature_2m_min: [25],
        apparent_temperature_max: [35],
        apparent_temperature_min: [27],
        precipitation_probability_max: [15],
        precipitation_sum: [0.2],
        wind_speed_10m_max: [20],
        sunrise: [`${startDate}T05:08`],
        sunset: [`${startDate}T17:12`],
      },
      hourly: {
        time: [`${startDate}T09:00`, `${startDate}T12:00`],
        temperature_2m: [27, 29],
        apparent_temperature: [29, 32],
        relative_humidity_2m: [74, 68],
        precipitation_probability: [10, 15],
        precipitation: [0, 0],
        weather_code: [1, 1],
        wind_speed_10m: [12, 14],
        is_day: [1, 1],
      },
    });

    const { res, body } = await request.get(
      buildWeatherPath({
        city: "Recife",
        startDate,
      }),
      testUserId,
    );

    expect(res.status).toBe(200);
    expect((body as { current: { time: string }; days: Array<{ sunrise: string }> }).current.time).toBe(
      `${startDate}T12:00`,
    );
  });
});
