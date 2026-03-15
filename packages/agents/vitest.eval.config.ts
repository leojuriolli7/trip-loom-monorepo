/// <reference types="vitest" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { defineConfig } from "vitest/config";

const serverEnv = parse(
  readFileSync(resolve(import.meta.dirname, "../../apps/server/.env")),
);

export default defineConfig({
  test: {
    retry: 3,
    include: ["src/evals/**/*.eval.ts"],
    reporters: ["vitest-evals/reporter"],
    testTimeout: 60_000,
    env: serverEnv,
  },
});
