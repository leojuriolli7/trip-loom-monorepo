import type { RequestLogger } from "evlog";

/**
 * Helper to avoid empty values in logs.
 */
export function setLogContext(
  logger: RequestLogger,
  context: Record<string, unknown>,
) {
  const entries = Object.entries(context).filter(([, value]) => {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value !== "object") {
      return true;
    }

    return Object.values(value).some(
      (nested) => nested !== undefined && nested !== null,
    );
  });

  if (entries.length === 0) {
    return;
  }

  logger.set(Object.fromEntries(entries));
}

/**
 * Helper to avoid cluttering logs with empty IDs.
 */
export function setLogEntityId(
  logger: RequestLogger,
  key: string,
  id?: string | null,
) {
  if (!id) {
    return;
  }

  setLogContext(logger, { [key]: { id } });
}
