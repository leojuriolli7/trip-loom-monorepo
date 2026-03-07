import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { itinerary, itineraryActivity, itineraryDay } from "../db/schema";
import type { DB_NewItineraryActivity, DB_NewItineraryDay } from "../db/types";
import type {
  CreateActivityInput,
  CreateDayInput,
  CreateItineraryInput,
  ItineraryDetailDTO,
  UpdateActivityInput,
  UpdateDayInput,
} from "@trip-loom/contracts/dto/itineraries";
import { ConflictError, NotFoundError } from "../errors";
import { generateId } from "../lib/nanoid";
import { getOwnedTripMeta } from "../lib/trips/ownership";
import {
  itineraryActivityColumns,
  itineraryDayColumns,
} from "../mappers/itineraries";

/**
 * Fetches the full itinerary with days and activities for a trip.
 * Days are sorted by dayNumber, activities by orderIndex.
 * Does NOT verify trip ownership - caller must ensure authorization.
 */
export async function getItineraryDetailsByTripId(
  tripId: string,
): Promise<ItineraryDetailDTO | null> {
  const row = await db.query.itinerary.findFirst({
    where: eq(itinerary.tripId, tripId),
    with: {
      days: {
        columns: itineraryDayColumns,
        orderBy: [asc(itineraryDay.dayNumber)],
        with: {
          activities: {
            columns: itineraryActivityColumns,
            orderBy: [asc(itineraryActivity.orderIndex)],
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  return row;
}

/**
 * Verifies that an itinerary exists for a trip.
 */
const getItineraryMeta = async (
  tripId: string,
): Promise<{ id: string } | null> => {
  const rows = await db
    .select({ id: itinerary.id })
    .from(itinerary)
    .where(eq(itinerary.tripId, tripId))
    .limit(1);

  return rows[0] ?? null;
};

/**
 * Verifies that a day belongs to the trip's itinerary.
 */
const getDayMeta = async (
  tripId: string,
  dayId: string,
): Promise<{ id: string; itineraryId: string } | null> => {
  const rows = await db
    .select({
      id: itineraryDay.id,
      itineraryId: itineraryDay.itineraryId,
    })
    .from(itineraryDay)
    .innerJoin(itinerary, eq(itineraryDay.itineraryId, itinerary.id))
    .where(and(eq(itinerary.tripId, tripId), eq(itineraryDay.id, dayId)))
    .limit(1);

  return rows[0] ?? null;
};

/**
 * Verifies that an activity belongs to the specified day in the trip's itinerary.
 */
const getActivityMeta = async (
  tripId: string,
  dayId: string,
  activityId: string,
): Promise<{ id: string } | null> => {
  const rows = await db
    .select({ id: itineraryActivity.id })
    .from(itineraryActivity)
    .innerJoin(
      itineraryDay,
      eq(itineraryActivity.itineraryDayId, itineraryDay.id),
    )
    .innerJoin(itinerary, eq(itineraryDay.itineraryId, itinerary.id))
    .where(
      and(
        eq(itinerary.tripId, tripId),
        eq(itineraryDay.id, dayId),
        eq(itineraryActivity.id, activityId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
};

const isUniqueViolationError = (
  error: unknown,
): error is { code: string; constraint_name?: string; constraint?: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const value = error as { code?: unknown };
  return value.code === "23505";
};

// =============================================================================
// Itinerary Operations
// =============================================================================

/**
 * Gets the itinerary for a trip with all days and activities.
 * Returns null if trip not found/owned or no itinerary exists.
 */
export async function getItinerary(
  userId: string,
  tripId: string,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  return getItineraryDetailsByTripId(tripId);
}

/**
 * Creates a new itinerary for a trip.
 * Can optionally include days and activities in one call.
 * Returns null if trip not found/owned, throws ConflictError if itinerary already exists.
 */
export async function createItinerary(
  userId: string,
  tripId: string,
  input: CreateItineraryInput,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  // First, ensure no duplicate day numbers were sent:
  const dayNumbers = new Set<number>();

  for (const day of input.days) {
    if (dayNumbers.has(day.dayNumber)) {
      throw new ConflictError(
        "Itinerary payload has duplicate dayNumber or duplicate activity orderIndex",
      );
    }

    dayNumbers.add(day.dayNumber);

    const activityOrderIndexes = new Set<number>();
    for (const activity of day.activities) {
      if (activityOrderIndexes.has(activity.orderIndex)) {
        throw new ConflictError(
          "Itinerary payload has duplicate dayNumber or duplicate activity orderIndex",
        );
      }

      activityOrderIndexes.add(activity.orderIndex);
    }
  }

  try {
    await db.transaction(async (tx) => {
      // Check if itinerary already exists (1:1 relationship)
      const existing = await tx
        .select({ id: itinerary.id })
        .from(itinerary)
        .where(eq(itinerary.tripId, tripId))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictError("Itinerary already exists for this trip");
      }

      const itineraryId = generateId();
      await tx.insert(itinerary).values({
        id: itineraryId,
        tripId,
      });

      // Pre-generate all IDs and build batch insert arrays
      const dayRows: DB_NewItineraryDay[] = [];
      const activityRows: DB_NewItineraryActivity[] = [];

      for (const dayInput of input.days) {
        const dayId = generateId();

        dayRows.push({
          id: dayId,
          itineraryId,
          dayNumber: dayInput.dayNumber,
          date: dayInput.date,
          title: dayInput.title ?? null,
          notes: dayInput.notes ?? null,
        });

        for (const activityInput of dayInput.activities) {
          activityRows.push({
            id: generateId(),
            itineraryDayId: dayId,
            orderIndex: activityInput.orderIndex,
            title: activityInput.title,
            description: activityInput.description ?? null,
            startTime: activityInput.startTime ?? null,
            endTime: activityInput.endTime ?? null,
            location: activityInput.location ?? null,
            locationUrl: activityInput.locationUrl ?? null,
            estimatedCostInCents: activityInput.estimatedCostInCents ?? null,
            imageUrl: activityInput.imageUrl ?? null,
            sourceUrl: activityInput.sourceUrl ?? null,
            sourceName: activityInput.sourceName ?? null,
          });
        }
      }

      // Batch insert all days in one query
      if (dayRows.length > 0) {
        await tx.insert(itineraryDay).values(dayRows);
      }

      // Batch insert all activities in one query
      if (activityRows.length > 0) {
        await tx.insert(itineraryActivity).values(activityRows);
      }
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }

    if (isUniqueViolationError(error)) {
      const constraint = error.constraint_name ?? error.constraint;

      if (constraint === "itinerary_trip_id_unique") {
        throw new ConflictError("Itinerary already exists for this trip");
      }

      if (
        constraint === "itinerary_day_unique" ||
        constraint === "itinerary_activity_order_unique"
      ) {
        throw new ConflictError(
          "Itinerary payload has duplicate dayNumber or duplicate activity orderIndex",
        );
      }
    }

    throw error;
  }

  return getItineraryDetailsByTripId(tripId);
}

/**
 * Deletes the entire itinerary for a trip (cascades to days and activities).
 * Returns false if trip not found/owned or no itinerary exists.
 */
export async function deleteItinerary(
  userId: string,
  tripId: string,
): Promise<boolean> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return false;
  }

  const deleted = await db
    .delete(itinerary)
    .where(eq(itinerary.tripId, tripId))
    .returning({ id: itinerary.id });

  if (deleted.length === 0) {
    return false;
  }

  return true;
}

// =============================================================================
// Day Operations
// =============================================================================

/**
 * Adds a new day to an existing itinerary.
 * Returns null if trip not found/owned, throws NotFoundError if no itinerary exists.
 */
export async function addDay(
  userId: string,
  tripId: string,
  input: CreateDayInput,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const itineraryMeta = await getItineraryMeta(tripId);
  if (!itineraryMeta) {
    throw new NotFoundError("Itinerary not found");
  }

  await db.insert(itineraryDay).values({
    id: generateId(),
    itineraryId: itineraryMeta.id,
    dayNumber: input.dayNumber,
    date: input.date,
    title: input.title ?? null,
    notes: input.notes ?? null,
  });

  return getItineraryDetailsByTripId(tripId);
}

/**
 * Updates an existing day.
 * Returns null if trip not found/owned, throws NotFoundError if day not found.
 */
export async function updateDay(
  userId: string,
  tripId: string,
  dayId: string,
  input: UpdateDayInput,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const dayMeta = await getDayMeta(tripId, dayId);
  if (!dayMeta) {
    throw new NotFoundError("Day not found");
  }

  const updateData: Partial<typeof itineraryDay.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.dayNumber !== undefined) {
    updateData.dayNumber = input.dayNumber;
  }
  if (input.date !== undefined) {
    updateData.date = input.date;
  }
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  await db
    .update(itineraryDay)
    .set(updateData)
    .where(eq(itineraryDay.id, dayId));

  return getItineraryDetailsByTripId(tripId);
}

/**
 * Deletes a day and all its activities.
 * Renumbers remaining days to maintain sequential order.
 * Returns null if trip not found/owned, throws NotFoundError if day not found.
 */
export async function deleteDay(
  userId: string,
  tripId: string,
  dayId: string,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const dayMeta = await getDayMeta(tripId, dayId);
  if (!dayMeta) {
    throw new NotFoundError("Day not found");
  }

  // Get the day number before deleting
  const [dayToDelete] = await db
    .select({ dayNumber: itineraryDay.dayNumber })
    .from(itineraryDay)
    .where(eq(itineraryDay.id, dayId))
    .limit(1);

  // Delete the day (activities cascade)
  await db.delete(itineraryDay).where(eq(itineraryDay.id, dayId));

  // Renumber remaining days that were after the deleted day
  if (dayToDelete) {
    await db
      .update(itineraryDay)
      .set({
        dayNumber: sql`${itineraryDay.dayNumber} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(itineraryDay.itineraryId, dayMeta.itineraryId),
          gt(itineraryDay.dayNumber, dayToDelete.dayNumber),
        ),
      );
  }

  return getItineraryDetailsByTripId(tripId);
}

// =============================================================================
// Activity Operations
// =============================================================================

/**
 * Adds a new activity to a day.
 * Returns null if trip not found/owned, throws NotFoundError if day not found.
 */
export async function addActivity(
  userId: string,
  tripId: string,
  dayId: string,
  input: CreateActivityInput,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const dayMeta = await getDayMeta(tripId, dayId);
  if (!dayMeta) {
    throw new NotFoundError("Day not found");
  }

  await db.insert(itineraryActivity).values({
    id: generateId(),
    itineraryDayId: dayId,
    orderIndex: input.orderIndex,
    title: input.title,
    description: input.description ?? null,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    location: input.location ?? null,
    locationUrl: input.locationUrl ?? null,
    estimatedCostInCents: input.estimatedCostInCents ?? null,
    imageUrl: input.imageUrl ?? null,
    sourceUrl: input.sourceUrl ?? null,
    sourceName: input.sourceName ?? null,
  });

  return getItineraryDetailsByTripId(tripId);
}

/**
 * Updates an existing activity.
 * Returns null if trip not found/owned, throws NotFoundError if activity not found.
 */
export async function updateActivity(
  userId: string,
  tripId: string,
  dayId: string,
  activityId: string,
  input: UpdateActivityInput,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const activityMeta = await getActivityMeta(tripId, dayId, activityId);
  if (!activityMeta) {
    throw new NotFoundError("Activity not found");
  }

  const updateData: Partial<typeof itineraryActivity.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.orderIndex !== undefined) {
    updateData.orderIndex = input.orderIndex;
  }
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.startTime !== undefined) {
    updateData.startTime = input.startTime;
  }
  if (input.endTime !== undefined) {
    updateData.endTime = input.endTime;
  }
  if (input.location !== undefined) {
    updateData.location = input.location;
  }
  if (input.locationUrl !== undefined) {
    updateData.locationUrl = input.locationUrl;
  }
  if (input.estimatedCostInCents !== undefined) {
    updateData.estimatedCostInCents = input.estimatedCostInCents;
  }
  if (input.imageUrl !== undefined) {
    updateData.imageUrl = input.imageUrl;
  }
  if (input.sourceUrl !== undefined) {
    updateData.sourceUrl = input.sourceUrl;
  }
  if (input.sourceName !== undefined) {
    updateData.sourceName = input.sourceName;
  }

  await db
    .update(itineraryActivity)
    .set(updateData)
    .where(eq(itineraryActivity.id, activityId));

  return getItineraryDetailsByTripId(tripId);
}

/**
 * Deletes an activity.
 * Reorders remaining activities to maintain sequential order.
 * Returns null if trip not found/owned, throws NotFoundError if activity not found.
 */
export async function deleteActivity(
  userId: string,
  tripId: string,
  dayId: string,
  activityId: string,
): Promise<ItineraryDetailDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const activityMeta = await getActivityMeta(tripId, dayId, activityId);
  if (!activityMeta) {
    throw new NotFoundError("Activity not found");
  }

  // Get the orderIndex before deleting
  const [activityToDelete] = await db
    .select({ orderIndex: itineraryActivity.orderIndex })
    .from(itineraryActivity)
    .where(eq(itineraryActivity.id, activityId))
    .limit(1);

  // Delete the activity
  await db
    .delete(itineraryActivity)
    .where(eq(itineraryActivity.id, activityId));

  // Reorder remaining activities that were after the deleted one
  if (activityToDelete) {
    await db
      .update(itineraryActivity)
      .set({
        orderIndex: sql`${itineraryActivity.orderIndex} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(itineraryActivity.itineraryDayId, dayId),
          gt(itineraryActivity.orderIndex, activityToDelete.orderIndex),
        ),
      );
  }

  return getItineraryDetailsByTripId(tripId);
}
