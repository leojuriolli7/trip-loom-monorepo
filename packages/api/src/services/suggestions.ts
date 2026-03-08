import { eq } from "drizzle-orm";
import { getThreadState, generateSuggestions } from "@trip-loom/agents";
import { NotFoundError } from "../errors";
import { getOwnedTripMeta } from "../lib/trips/ownership";
import { db } from "../db";
import { trip, destination } from "../db/schema";
import { computedTripStatusSql } from "../lib/trips/status";
import type { SuggestionsResponse } from "../dto/suggestions";
import { getAgentsConfig } from "../lib/agents/config";
import { isBaseMessage } from "../lib/agents/is-base-message";

async function getTripContext(tripId: string) {
  const rows = await db
    .select({
      status: computedTripStatusSql,
      destinationName: destination.name,
    })
    .from(trip)
    .leftJoin(destination, eq(trip.destinationId, destination.id))
    .where(eq(trip.id, tripId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getSuggestions(
  userId: string,
  tripId: string,
): Promise<SuggestionsResponse> {
  const ownsTrip = await getOwnedTripMeta(userId, tripId);

  if (!ownsTrip) {
    throw new NotFoundError("Trip not found");
  }

  const { databaseUrl } = getAgentsConfig();
  const threadState = await getThreadState(databaseUrl, tripId);

  const rawMessages = Array.isArray(
    threadState?.checkpoint?.channel_values?.messages,
  )
    ? threadState.checkpoint.channel_values.messages.filter(isBaseMessage)
    : [];

  if (rawMessages.length === 0) {
    return { suggestions: [] };
  }

  const tripContext = await getTripContext(tripId);

  const suggestions = await generateSuggestions({
    messages: rawMessages,
    tripStatus: tripContext?.status ?? undefined,
    destinationName: tripContext?.destinationName ?? undefined,
  });

  return { suggestions };
}
