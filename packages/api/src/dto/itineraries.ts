import { z } from "zod";

const isoDateSchema = z.string().date();

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
