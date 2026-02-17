import type { AirportNormalizationSummary } from "./airport-normalizer";

export const logAirportNormalizationSummary = (
  summary: AirportNormalizationSummary,
): void => {
  const { accepted, skipped, skippedByReason, skippedExamples } = summary;

  console.log(
    `Found ${accepted} valid airports` +
      (skipped > 0 ? ` (skipped ${skipped} rows)` : ""),
  );

  if (skipped <= 0) {
    return;
  }

  console.log("Airport skip reasons:");
  for (const [reason, count] of Object.entries(skippedByReason)) {
    if (count <= 0) {
      continue;
    }

    console.log(`  - ${reason}: ${count}`);
    const examples = skippedExamples[reason as keyof typeof skippedExamples];
    if (examples && examples.length > 0) {
      console.log(`    examples: ${examples.join(" | ")}`);
    }
  }
};
