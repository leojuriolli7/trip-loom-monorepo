import { z } from "zod";

const isoDateSchema = z.string().date();

// Time format validation (HH:mm)
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, expected HH:mm");

// =============================================================================
// Output Schemas (for API responses)
// =============================================================================

export const itineraryActivitySchema = z.object({
  id: z.string(),
  itineraryDayId: z.string(),
  orderIndex: z.number().int().min(0),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  location: z.string().nullable(),
  locationUrl: z.string().nullable(),
  estimatedCostInCents: z.number().int().min(0).nullable(),
  imageUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  sourceName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ItineraryActivityDTO = z.infer<typeof itineraryActivitySchema>;

export const itineraryDaySchema = z.object({
  id: z.string(),
  itineraryId: z.string(),
  dayNumber: z.number().int().positive(),
  date: isoDateSchema,
  title: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  activities: z.array(itineraryActivitySchema),
});

export type ItineraryDayDTO = z.infer<typeof itineraryDaySchema>;

export const itineraryDetailSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  days: z.array(itineraryDaySchema),
});

export type ItineraryDetailDTO = z.infer<typeof itineraryDetailSchema>;

export const itineraryWithTripSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  tripTitle: z.string().nullable(),
  tripDestination: z.string().nullable(),
  tripStartDate: z.string().nullable(),
  tripEndDate: z.string().nullable(),
  createdAt: z.date(),
  days: z.array(itineraryDaySchema),
});

export type ItineraryWithTripDTO = z.infer<typeof itineraryWithTripSchema>;

// =============================================================================
// Input Schemas (for API requests)
// =============================================================================

// Activity input (nested in day creation)
const activityInputSchema = z.object({
  orderIndex: z.number().int().min(0),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  location: z.string().max(500).optional(),
  locationUrl: z.string().url().max(2000).optional(),
  estimatedCostInCents: z.number().int().min(0).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  sourceName: z.string().max(200).optional(),
});

// Day input (nested in itinerary creation)
const dayInputSchema = z.object({
  dayNumber: z.number().int().positive(),
  date: isoDateSchema,
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(5000).optional(),
  activities: z.array(activityInputSchema).optional().default([]),
});

// Create itinerary (can include days and activities in one call)
export const createItineraryInputSchema = z.object({
  days: z.array(dayInputSchema).optional().default([]),
});

export type CreateItineraryInput = z.infer<typeof createItineraryInputSchema>;

// Add a day to existing itinerary
export const createDayInputSchema = z.object({
  dayNumber: z.number().int().positive(),
  date: isoDateSchema,
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateDayInput = z.infer<typeof createDayInputSchema>;

// Update existing day
export const updateDayInputSchema = z.object({
  dayNumber: z.number().int().positive().optional(),
  date: isoDateSchema.optional(),
  title: z.string().min(1).max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export type UpdateDayInput = z.infer<typeof updateDayInputSchema>;

// Add activity to a day
export const createActivityInputSchema = z.object({
  orderIndex: z.number().int().min(0),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  location: z.string().max(500).optional(),
  locationUrl: z.string().url().max(2000).optional(),
  estimatedCostInCents: z.number().int().min(0).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  sourceName: z.string().max(200).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Update existing activity
export const updateActivityInputSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  locationUrl: z.string().url().max(2000).nullable().optional(),
  estimatedCostInCents: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().url().max(2000).nullable().optional(),
  sourceUrl: z.string().url().max(2000).nullable().optional(),
  sourceName: z.string().max(200).nullable().optional(),
});

export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>;
