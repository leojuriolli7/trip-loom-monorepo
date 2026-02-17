/// <reference types="node" />
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/**
 * This script will populate hotels worldwide by going in batches throughout the world
 * using the Overpass API.
 *
 * ```
 * pnpm data:populate:hotels:worldwide
 * ```
 */

type CliArgs = {
  destinationsPath: string;
  outputPath: string;
  statePath: string;
  batchSize: number;
  countryCodes: Set<string>;
  delayBetweenBatchesMs: number;
  delayBetweenCountriesMs: number;
  maxBatchAttempts: number;
  endpoint: string;
  fallbackEndpoint: string | null;
  radiusMeters: number;
  perDestinationDelayMs: number;
  timeoutMs: number;
  generatorRetries: number;
  resetState: boolean;
  stopOnPermanentFailure: boolean;
  strictDestinationFailures: boolean;
};

type CountryProgress = {
  totalDestinations: number;
  nextOffset: number;
  completedBatches: number;
  failedBatches: number;
  done: boolean;
  lastError: string | null;
  updatedAt: string;
};

type ProgressState = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  batchSize: number;
  countries: Record<string, CountryProgress>;
};

const destinationInputSchema = z.object({
  countryCode: z.string().length(2),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

const progressStateSchema: z.ZodType<ProgressState> = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  batchSize: z.number().int().positive(),
  countries: z.record(
    z.string(),
    z.object({
      totalDestinations: z.number().int().nonnegative(),
      nextOffset: z.number().int().nonnegative(),
      completedBatches: z.number().int().nonnegative(),
      failedBatches: z.number().int().nonnegative(),
      done: z.boolean(),
      lastError: z.string().nullable(),
      updatedAt: z.string(),
    }),
  ),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_ROOT = path.resolve(__dirname, "..");
const GENERATOR_PATH = path.join(__dirname, "generate-hotels-from-overpass.ts");

const DEFAULT_DESTINATIONS_PATH = path.join(
  SEEDS_ROOT,
  "data/destinations.json",
);
const DEFAULT_HOTELS_PATH = path.join(SEEDS_ROOT, "data/hotels.json");
const DEFAULT_STATE_PATH = path.join(
  SEEDS_ROOT,
  "data/hotels-populate-state.json",
);
const DEFAULT_ENDPOINT = "https://overpass-api.de/api/interpreter";
const DEFAULT_FALLBACK_ENDPOINT =
  "https://overpass.kumi.systems/api/interpreter";

function parseCliArgs(argv: string[]): CliArgs {
  let destinationsPath = DEFAULT_DESTINATIONS_PATH;
  let outputPath = DEFAULT_HOTELS_PATH;
  let statePath = DEFAULT_STATE_PATH;
  let batchSize = 150;
  const countryCodes = new Set<string>();
  let delayBetweenBatchesMs = 5000;
  let delayBetweenCountriesMs = 15000;
  let maxBatchAttempts = 4;
  let endpoint = DEFAULT_ENDPOINT;
  let fallbackEndpoint: string | null = DEFAULT_FALLBACK_ENDPOINT;
  let radiusMeters = 30000;
  let perDestinationDelayMs = 1200;
  let timeoutMs = 90000;
  let generatorRetries = 3;
  let resetState = false;
  let stopOnPermanentFailure = true;
  let strictDestinationFailures = true;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];

    if (arg === "--destinations-path" && value) {
      destinationsPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--output-path" && value) {
      outputPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--state-path" && value) {
      statePath = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--batch-size" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        batchSize = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--country-code" && value) {
      value
        .split(",")
        .map((entry) => entry.trim().toUpperCase())
        .filter((entry) => entry.length === 2)
        .forEach((entry) => countryCodes.add(entry));
      index += 1;
      continue;
    }
    if (arg === "--delay-between-batches-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        delayBetweenBatchesMs = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--delay-between-countries-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        delayBetweenCountriesMs = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--max-batch-attempts" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        maxBatchAttempts = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--endpoint" && value) {
      endpoint = value.trim();
      index += 1;
      continue;
    }
    if (arg === "--fallback-endpoint" && value) {
      fallbackEndpoint = value.trim() ? value.trim() : null;
      index += 1;
      continue;
    }
    if (arg === "--radius-meters" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        radiusMeters = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--delay-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        perDestinationDelayMs = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        timeoutMs = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--generator-retries" && value) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        generatorRetries = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === "--reset-state") {
      resetState = true;
      continue;
    }
    if (arg === "--continue-on-permanent-failure") {
      stopOnPermanentFailure = false;
      continue;
    }
    if (arg === "--allow-partial-batches") {
      strictDestinationFailures = false;
      continue;
    }
  }

  return {
    destinationsPath,
    outputPath,
    statePath,
    batchSize,
    countryCodes,
    delayBetweenBatchesMs,
    delayBetweenCountriesMs,
    maxBatchAttempts,
    endpoint,
    fallbackEndpoint,
    radiusMeters,
    perDestinationDelayMs,
    timeoutMs,
    generatorRetries,
    resetState,
    stopOnPermanentFailure,
    strictDestinationFailures,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nowIso(): string {
  return new Date().toISOString();
}

function backoffForAttempt(attempt: number): number {
  const jitter = Math.floor(Math.random() * 1200);
  return Math.min(120000, 4000 * 2 ** (attempt - 1) + jitter);
}

async function readDestinationsCountByCountry(
  destinationsPath: string,
): Promise<Map<string, number>> {
  const raw = JSON.parse(await readFile(destinationsPath, "utf8")) as unknown[];
  const counts = new Map<string, number>();

  for (const row of raw) {
    const parsed = destinationInputSchema.safeParse(row);
    if (!parsed.success) {
      continue;
    }

    const { countryCode, latitude, longitude } = parsed.data;
    if (latitude === null || longitude === null) {
      continue;
    }

    counts.set(countryCode, (counts.get(countryCode) ?? 0) + 1);
  }

  return counts;
}

async function loadState(
  statePath: string,
  resetState: boolean,
  batchSize: number,
): Promise<ProgressState> {
  if (resetState) {
    return {
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      batchSize,
      countries: {},
    };
  }

  try {
    const raw = JSON.parse(await readFile(statePath, "utf8")) as unknown;
    const parsed = progressStateSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("Invalid state file schema");
    }
    return parsed.data;
  } catch {
    return {
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      batchSize,
      countries: {},
    };
  }
}

async function saveState(
  statePath: string,
  state: ProgressState,
): Promise<void> {
  state.updatedAt = nowIso();
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function buildGeneratorArgs(
  args: CliArgs,
  countryCode: string,
  offset: number,
  limit: number,
): string[] {
  const generatorArgs = [
    "--import",
    "tsx/esm",
    GENERATOR_PATH,
    "--destinations-path",
    args.destinationsPath,
    "--output-path",
    args.outputPath,
    "--country-code",
    countryCode,
    "--offset",
    String(offset),
    "--limit",
    String(limit),
    "--radius-meters",
    String(args.radiusMeters),
    "--delay-ms",
    String(args.perDestinationDelayMs),
    "--timeout-ms",
    String(args.timeoutMs),
    "--max-retries",
    String(args.generatorRetries),
    "--endpoint",
    args.endpoint,
  ];

  if (args.fallbackEndpoint) {
    generatorArgs.push("--fallback-endpoint", args.fallbackEndpoint);
  }
  if (args.strictDestinationFailures) {
    generatorArgs.push("--fail-on-destination-errors");
  }

  return generatorArgs;
}

function runGeneratorBatch(
  args: CliArgs,
  countryCode: string,
  offset: number,
  limit: number,
): Promise<number> {
  const spawnArgs = buildGeneratorArgs(args, countryCode, offset, limit);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, spawnArgs, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function ensureCountryProgress(
  state: ProgressState,
  countryCode: string,
  totalDestinations: number,
): CountryProgress {
  const existing = state.countries[countryCode];
  if (existing) {
    existing.totalDestinations = totalDestinations;
    if (existing.nextOffset > totalDestinations) {
      existing.nextOffset = totalDestinations;
    }
    return existing;
  }

  const created: CountryProgress = {
    totalDestinations,
    nextOffset: 0,
    completedBatches: 0,
    failedBatches: 0,
    done: totalDestinations === 0,
    lastError: null,
    updatedAt: nowIso(),
  };
  state.countries[countryCode] = created;
  return created;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const countsByCountry = await readDestinationsCountByCountry(
    args.destinationsPath,
  );

  const selectedCountries = Array.from(countsByCountry.keys())
    .filter((countryCode) =>
      args.countryCodes.size === 0 ? true : args.countryCodes.has(countryCode),
    )
    .sort((a, b) => a.localeCompare(b));

  if (selectedCountries.length === 0) {
    console.log("No matching countries to process.");
    return;
  }

  const state = await loadState(
    args.statePath,
    args.resetState,
    args.batchSize,
  );
  await saveState(args.statePath, state);

  console.log(
    `Starting worldwide hotel population for ${selectedCountries.length} countries`,
  );
  console.log(`State file: ${args.statePath}`);
  console.log(`Batch size: ${args.batchSize}`);

  for (
    let countryIndex = 0;
    countryIndex < selectedCountries.length;
    countryIndex += 1
  ) {
    const countryCode = selectedCountries[countryIndex] as string;
    const totalDestinations = countsByCountry.get(countryCode) ?? 0;
    const progress = ensureCountryProgress(
      state,
      countryCode,
      totalDestinations,
    );

    if (progress.done || progress.nextOffset >= totalDestinations) {
      progress.done = true;
      progress.updatedAt = nowIso();
      await saveState(args.statePath, state);
      console.log(
        `[${countryIndex + 1}/${selectedCountries.length}] ${countryCode} already complete (${totalDestinations} destinations)`,
      );
      continue;
    }

    console.log(
      `[${countryIndex + 1}/${selectedCountries.length}] Processing ${countryCode}: ${progress.nextOffset}/${totalDestinations}`,
    );

    while (progress.nextOffset < totalDestinations) {
      const offset = progress.nextOffset;
      const remaining = totalDestinations - offset;
      const limit = Math.min(args.batchSize, remaining);
      let batchSucceeded = false;
      let lastError: string | null = null;

      for (let attempt = 1; attempt <= args.maxBatchAttempts; attempt += 1) {
        console.log(
          `Batch country=${countryCode} offset=${offset} limit=${limit} attempt=${attempt}/${args.maxBatchAttempts}`,
        );
        const exitCode = await runGeneratorBatch(
          args,
          countryCode,
          offset,
          limit,
        );

        if (exitCode === 0) {
          batchSucceeded = true;
          break;
        }

        lastError = `Generator exited with code ${exitCode}`;
        progress.failedBatches += 1;
        progress.lastError = lastError;
        progress.updatedAt = nowIso();
        await saveState(args.statePath, state);

        if (attempt < args.maxBatchAttempts) {
          const backoffMs = backoffForAttempt(attempt);
          console.warn(
            `Batch failed for ${countryCode} offset=${offset}. Retrying in ${backoffMs}ms`,
          );
          await sleep(backoffMs);
        }
      }

      if (!batchSucceeded) {
        progress.lastError = lastError ?? "Unknown batch failure";
        progress.updatedAt = nowIso();
        await saveState(args.statePath, state);

        const message = `Permanent batch failure for ${countryCode} offset=${offset}`;
        if (args.stopOnPermanentFailure) {
          throw new Error(message);
        }

        console.error(`${message}; continuing to next country`);
        break;
      }

      progress.nextOffset += limit;
      progress.completedBatches += 1;
      progress.lastError = null;
      progress.updatedAt = nowIso();
      await saveState(args.statePath, state);

      if (
        args.delayBetweenBatchesMs > 0 &&
        progress.nextOffset < totalDestinations
      ) {
        await sleep(args.delayBetweenBatchesMs);
      }
    }

    if (progress.nextOffset >= totalDestinations) {
      progress.done = true;
      progress.updatedAt = nowIso();
      await saveState(args.statePath, state);
      console.log(`Finished ${countryCode}`);
    }

    if (
      args.delayBetweenCountriesMs > 0 &&
      countryIndex < selectedCountries.length - 1
    ) {
      await sleep(args.delayBetweenCountriesMs);
    }
  }

  console.log("Worldwide hotel population run finished.");
}

main().catch(async (error) => {
  console.error("Hotel population orchestrator failed:", error);
  process.exit(1);
});
