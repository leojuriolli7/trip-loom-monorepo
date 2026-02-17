import { z } from "zod";

const airportInputSchema = z.record(z.string(), z.unknown());

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toNullableInt = (value: unknown): number | null => {
  const parsed = toNullableNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableUrl = (value: unknown): string | null => {
  const text = toNullableString(value);
  if (!text) {
    return null;
  }

  try {
    // eslint-disable-next-line no-new
    new URL(text);
    return text;
  } catch {
    return null;
  }
};

const parseScheduledService = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
};

const getInputValue = (
  input: z.infer<typeof airportInputSchema>,
  ...keys: string[]
): unknown => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      return input[key];
    }
  }

  return undefined;
};

const pickFirstString = (
  input: z.infer<typeof airportInputSchema>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const value = toNullableString(getInputValue(input, key));
    if (value !== null) {
      return value;
    }
  }

  return null;
};

const sanitizeCode = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

export type AirportSkipReason =
  | "invalid_row_shape"
  | "missing_code"
  | "invalid_code_format"
  | "duplicate_code";

export type AirportSeedRow = {
  code: string;
  icao: string | null;
  name: string;
  city: string | null;
  countryCode: string;
  continent: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  elevationFt: number | null;
  airportType: string | null;
  scheduledService: boolean;
  runwayLength: number | null;
  wikipedia: string | null;
  website: string | null;
};

type AirportSeedResult =
  | { ok: true; airport: AirportSeedRow }
  | { ok: false; reason: AirportSkipReason };

const toAirportSeed = (
  input: z.infer<typeof airportInputSchema>,
): AirportSeedResult => {
  const rawCode = pickFirstString(input, ["code", "iata", "icao"]);
  if (!rawCode) {
    return { ok: false, reason: "missing_code" };
  }

  const code = sanitizeCode(rawCode);
  if (!/^[A-Z0-9]{3,4}$/.test(code)) {
    return { ok: false, reason: "invalid_code_format" };
  }

  const name = pickFirstString(input, ["name", "airport"]) ?? code;
  const rawCountryCode = pickFirstString(input, [
    "countryCode",
    "country_code",
  ]);
  const countryCode =
    rawCountryCode && /^[A-Za-z]{2}$/.test(rawCountryCode)
      ? rawCountryCode.toUpperCase()
      : "ZZ";
  const timezone = pickFirstString(input, ["timezone", "time"]) ?? "UTC";
  const rawIcao = pickFirstString(input, ["icao"]);
  const icao = (() => {
    if (!rawIcao) {
      return null;
    }

    const normalized = sanitizeCode(rawIcao);
    return /^[A-Z0-9]{3,4}$/.test(normalized) ? normalized : null;
  })();

  return {
    ok: true,
    airport: {
      code,
      icao,
      name,
      city: pickFirstString(input, ["city"]),
      countryCode,
      continent: pickFirstString(input, ["continent"]),
      timezone,
      latitude: toNullableNumber(getInputValue(input, "latitude")),
      longitude: toNullableNumber(getInputValue(input, "longitude")),
      elevationFt: toNullableInt(
        getInputValue(input, "elevationFt", "elevation_ft"),
      ),
      airportType: pickFirstString(input, ["airportType", "type"]),
      scheduledService: parseScheduledService(
        getInputValue(input, "scheduledService", "scheduled_service"),
      ),
      runwayLength: toNullableInt(
        getInputValue(input, "runwayLength", "runway_length"),
      ),
      wikipedia: toNullableUrl(getInputValue(input, "wikipedia")),
      website: toNullableUrl(getInputValue(input, "website")),
    },
  };
};

export type AirportNormalizationSummary = {
  totalInput: number;
  accepted: number;
  skipped: number;
  skippedByReason: Record<AirportSkipReason, number>;
  skippedExamples: Partial<Record<AirportSkipReason, string[]>>;
};

export const normalizeAirportRows = (
  rows: unknown[],
): { airports: AirportSeedRow[]; summary: AirportNormalizationSummary } => {
  const airports: AirportSeedRow[] = [];
  const seenCodes = new Set<string>();
  const skippedByReason: Record<AirportSkipReason, number> = {
    invalid_row_shape: 0,
    missing_code: 0,
    invalid_code_format: 0,
    duplicate_code: 0,
  };
  const skippedExamples: Partial<Record<AirportSkipReason, string[]>> = {};

  const addSkip = (reason: AirportSkipReason, example: string) => {
    skippedByReason[reason] += 1;
    if (!skippedExamples[reason]) {
      skippedExamples[reason] = [];
    }
    if ((skippedExamples[reason] ?? []).length < 5) {
      skippedExamples[reason]?.push(example);
    }
  };

  rows.forEach((raw, index) => {
    const parsed = airportInputSchema.safeParse(raw);
    if (!parsed.success) {
      addSkip("invalid_row_shape", `index=${index}`);
      return;
    }

    const result = toAirportSeed(parsed.data);
    if (!result.ok) {
      const rawCode = String(
        getInputValue(parsed.data, "code", "iata", "icao") ?? "",
      );
      addSkip(result.reason, `index=${index}, code='${rawCode}'`);
      return;
    }

    if (seenCodes.has(result.airport.code)) {
      addSkip(
        "duplicate_code",
        `index=${index}, code='${result.airport.code}'`,
      );
      return;
    }

    seenCodes.add(result.airport.code);
    airports.push(result.airport);
  });

  const skipped = Object.values(skippedByReason).reduce(
    (sum, value) => sum + value,
    0,
  );

  return {
    airports,
    summary: {
      totalInput: rows.length,
      accepted: airports.length,
      skipped,
      skippedByReason,
      skippedExamples,
    },
  };
};

export const airportsSeedSchema = z
  .array(z.unknown())
  .transform((rows) => normalizeAirportRows(rows).airports);
