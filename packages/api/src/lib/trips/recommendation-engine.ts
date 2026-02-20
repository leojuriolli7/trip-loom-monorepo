import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../../db";
import { destination, trip, userPreference } from "../../db/schema";
import type { RecommendedDestinationDTO } from "../../dto/destinations";
import type { Region, TravelInterest } from "../../enums";
import { destinationSelectFields } from "../../mappers/destinations";
import { combineConditions } from "../pagination";
import { computedTripStatusSql } from "./status";

// Keep weights centralized so tuning recommendation behavior is straightforward.
const SCORE_WEIGHTS = {
  preferredRegion: 3,
  visitedRegion: 2,
  preferredHighlight: 1,
  visitedHighlight: 1,
} as const;

interface RecommendationContext {
  preferredRegions: Region[];
  travelInterests: TravelInterest[];
  visitedRegions: Region[];
  visitedHighlights: TravelInterest[];
  visitedDestinationIds: string[];
}

interface DefaultDestinationRow {
  [key: string]: unknown;
  id: string;
  name: string;
  country: string;
  country_code: string;
  region: Region | null;
  timezone: string;
  images_urls: Array<{ url: string; isCover: boolean; caption: string }> | null;
  description: string | null;
  highlights: TravelInterest[] | null;
  best_time_to_visit: string | null;
  created_at: string;
  updated_at: string;
}

// Helper for strongly-typed SQL arrays in scoring/filter expressions.
function sqlArray<T extends string>(
  values: T[],
  typeCast: string,
): ReturnType<typeof sql> | null {
  if (values.length === 0) return null;
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::${sql.raw(typeCast)}[]`;
}

// Fisher-Yates shuffle in memory avoids ORDER BY RANDOM() full-sort costs.
function shuffle<T>(values: readonly T[]): T[] {
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function getRecommendedDestinations(
  userId: string,
  limit: number = 10,
): Promise<RecommendedDestinationDTO[]> {
  const context = await buildRecommendationContext(userId);

  // If the user has no preference/history signal, immediately serve defaults.
  if (!hasRecommendationContext(context)) {
    return getDefaultDestinations(limit);
  }

  const {
    preferredRegions,
    travelInterests,
    visitedRegions,
    visitedHighlights,
    visitedDestinationIds,
  } = context;

  const preferredRegionsArr = sqlArray(preferredRegions, "region");
  const visitedRegionsArr = sqlArray(visitedRegions, "region");
  const preferredHighlightsArr = sqlArray(travelInterests, "travel_interest");
  const visitedHighlightsArr = sqlArray(visitedHighlights, "travel_interest");

  const allRegionsArr = sqlArray(
    [...new Set([...preferredRegions, ...visitedRegions])],
    "region",
  );
  const allHighlightsArr = sqlArray(
    [...new Set([...travelInterests, ...visitedHighlights])],
    "travel_interest",
  );

  const totalScore = sql<number>`(
    ${preferredRegionsArr ? sql`CASE WHEN ${destination.region} = ANY(${preferredRegionsArr}) THEN ${SCORE_WEIGHTS.preferredRegion} ELSE 0 END` : sql`0`}
    + ${visitedRegionsArr ? sql`CASE WHEN ${destination.region} = ANY(${visitedRegionsArr}) THEN ${SCORE_WEIGHTS.visitedRegion} ELSE 0 END` : sql`0`}
    + ${preferredHighlightsArr ? sql`COALESCE((SELECT COUNT(*)::int FROM unnest(${destination.highlights}) highlight WHERE highlight = ANY(${preferredHighlightsArr})), 0) * ${SCORE_WEIGHTS.preferredHighlight}` : sql`0`}
    + ${visitedHighlightsArr ? sql`COALESCE((SELECT COUNT(*)::int FROM unnest(${destination.highlights}) highlight WHERE highlight = ANY(${visitedHighlightsArr})), 0) * ${SCORE_WEIGHTS.visitedHighlight}` : sql`0`}
  )::int`;

  const matchConditions: ReturnType<typeof sql>[] = [];
  if (allRegionsArr) {
    matchConditions.push(sql`${destination.region} = ANY(${allRegionsArr})`);
  }
  if (allHighlightsArr) {
    matchConditions.push(sql`${destination.highlights} && ${allHighlightsArr}`);
  }

  const excludeVisited =
    visitedDestinationIds.length > 0
      ? sql`${destination.id} != ALL(${sqlArray(visitedDestinationIds, "text")})`
      : undefined;

  const results = await db
    .select({
      ...destinationSelectFields,
      matchScore: totalScore,
    })
    .from(destination)
    .where(
      combineConditions(
        excludeVisited,
        matchConditions.length > 0 ? or(...matchConditions) : undefined,
      ),
    )
    .orderBy(desc(totalScore), desc(destination.createdAt))
    .limit(limit);

  // If personalization has no matches, keep the section populated with defaults.
  if (results.length === 0) {
    return getDefaultDestinations(limit);
  }

  return results.map((recommendedDestination) => ({
    ...recommendedDestination,
    matchReason: generateMatchReason(
      recommendedDestination.region,
      recommendedDestination.highlights,
      context,
    ),
  }));
}

async function buildRecommendationContext(
  userId: string,
): Promise<RecommendationContext> {
  const [preferences, pastTrips] = await Promise.all([
    db.query.userPreference.findFirst({
      where: eq(userPreference.userId, userId),
    }),
    db
      .select({
        destinationId: trip.destinationId,
        destinationRegion: destination.region,
        destinationHighlights: destination.highlights,
      })
      .from(trip)
      .leftJoin(destination, eq(trip.destinationId, destination.id))
      .where(
        combineConditions(eq(trip.userId, userId), sql`${computedTripStatusSql} = 'past'`),
      ),
  ]);

  const visitedDestinationIds: string[] = [];
  const visitedRegions: Region[] = [];
  const visitedHighlights: TravelInterest[] = [];

  for (const pastTrip of pastTrips) {
    if (pastTrip.destinationId) {
      visitedDestinationIds.push(pastTrip.destinationId);
    }
    if (pastTrip.destinationRegion) {
      visitedRegions.push(pastTrip.destinationRegion);
    }
    if (pastTrip.destinationHighlights) {
      visitedHighlights.push(...pastTrip.destinationHighlights);
    }
  }

  return {
    preferredRegions: preferences?.preferredRegions ?? [],
    travelInterests: preferences?.travelInterests ?? [],
    visitedRegions: [...new Set(visitedRegions)],
    visitedHighlights: [...new Set(visitedHighlights)],
    visitedDestinationIds: [...new Set(visitedDestinationIds)],
  };
}

function hasRecommendationContext(context: RecommendationContext): boolean {
  return (
    context.preferredRegions.length > 0 ||
    context.travelInterests.length > 0 ||
    context.visitedRegions.length > 0 ||
    context.visitedHighlights.length > 0
  );
}

async function getDefaultDestinations(
  limit: number,
): Promise<RecommendedDestinationDTO[]> {
  // Pick one destination per region (latest by created_at), then shuffle in app code.
  // This keeps the user-visible order varied without DB-level RANDOM() sorting.
  const regionalResults = await db.execute<DefaultDestinationRow>(sql`
    SELECT DISTINCT ON (region)
      id,
      name,
      country,
      country_code,
      region,
      timezone,
      images_urls,
      description,
      highlights,
      best_time_to_visit,
      created_at,
      updated_at
    FROM destination
    WHERE region IS NOT NULL
    ORDER BY region, created_at DESC
  `);

  return shuffle(regionalResults)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      name: row.name,
      country: row.country,
      countryCode: row.country_code,
      region: row.region,
      timezone: row.timezone,
      imagesUrls: row.images_urls,
      description: row.description,
      highlights: row.highlights,
      bestTimeToVisit: row.best_time_to_visit,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      matchScore: 0,
      matchReason: row.region ? `Explore ${row.region}` : "Popular destination",
    }));
}

function generateMatchReason(
  destinationRegion: Region | null,
  destinationHighlights: TravelInterest[] | null,
  context: RecommendationContext,
): string {
  const {
    preferredRegions,
    travelInterests,
    visitedRegions,
    visitedHighlights,
  } = context;

  const reasons: string[] = [];

  if (destinationRegion && preferredRegions.includes(destinationRegion)) {
    reasons.push(`in ${destinationRegion}`);
  } else if (destinationRegion && visitedRegions.includes(destinationRegion)) {
    reasons.push("similar to places you've visited");
  }

  const preferredHighlightMatches = (destinationHighlights ?? [])
    .filter((highlight) => travelInterests.includes(highlight))
    .slice(0, 2);

  if (preferredHighlightMatches.length > 0) {
    const formatted = preferredHighlightMatches
      .map(formatInterest)
      .join(" and ");
    reasons.push(`great for ${formatted}`);
  } else {
    const historyHighlightMatches = (destinationHighlights ?? [])
      .filter((highlight) => visitedHighlights.includes(highlight))
      .slice(0, 2);

    if (historyHighlightMatches.length > 0) {
      reasons.push("based on your travel history");
    }
  }

  if (reasons.length === 0) {
    return "Recommended for you";
  }

  if (reasons.length === 1) {
    return capitalizeFirst(reasons[0]);
  }

  return capitalizeFirst(reasons.join(", "));
}

function formatInterest(interest: TravelInterest): string {
  const specialLabels: Partial<Record<TravelInterest, string>> = {
    food: "food lovers",
    photography: "photographers",
    art: "art enthusiasts",
    wine: "wine lovers",
    diving: "divers",
    hiking: "hikers",
    skiing: "skiers",
  };
  return specialLabels[interest] ?? interest;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const recommendationEngine = {
  getRecommendedDestinations,
};
