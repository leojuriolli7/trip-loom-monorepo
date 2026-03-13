import { z } from "zod";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, expected HH:mm");

const googlePlaceCreateFields = {
  googlePlaceId: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe("Optional Google Maps place ID chosen from search_places."),
  googlePlaceDisplayName: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe("Optional Google Maps place name for the selected place."),
  googleMapsUrl: z
    .string()
    .url()
    .max(2000)
    .optional()
    .describe("Optional canonical Google Maps URL for the selected place."),
  googleFormattedAddress: z
    .string()
    .max(500)
    .optional()
    .describe("Optional formatted address returned by Google Maps."),
  googleLat: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe("Optional Google Maps latitude for the selected place."),
  googleLng: z
    .number()
    .min(-180)
    .max(180)
    .optional()
    .describe("Optional Google Maps longitude for the selected place."),
} as const;

const googlePlaceUpdateFields = {
  googlePlaceId: z
    .string()
    .min(1)
    .max(255)
    .nullable()
    .optional()
    .describe("Optional new Google Maps place ID; use null to clear."),
  googlePlaceDisplayName: z
    .string()
    .min(1)
    .max(255)
    .nullable()
    .optional()
    .describe("Optional new Google Maps place name; use null to clear."),
  googleMapsUrl: z
    .string()
    .url()
    .max(2000)
    .nullable()
    .optional()
    .describe("Optional new Google Maps URL; use null to clear."),
  googleFormattedAddress: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .describe("Optional new formatted address; use null to clear."),
  googleLat: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional()
    .describe("Optional new latitude; use null to clear."),
  googleLng: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional()
    .describe("Optional new longitude; use null to clear."),
} as const;

export const createItineraryActivityInputSchema = z.object({
  orderIndex: z
    .number()
    .int()
    .min(0)
    .describe("Zero-based order of this activity within the day."),
  title: z.string().min(1).max(200).describe("Activity title."),
  description: z
    .string()
    .max(2000)
    .optional()
    .describe("Optional activity description."),
  startTime: timeSchema
    .optional()
    .describe("Optional start time in HH:mm format."),
  endTime: timeSchema.optional().describe("Optional end time in HH:mm format."),
  location: z
    .string()
    .max(500)
    .optional()
    .describe("Optional activity location label."),
  locationUrl: z
    .string()
    .url()
    .max(2000)
    .optional()
    .describe("Optional external location URL."),
  estimatedCostInCents: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Optional estimated activity cost in cents."),
  imageUrl: z
    .string()
    .url()
    .max(2000)
    .optional()
    .describe("Optional image URL for this activity."),
  sourceUrl: z
    .string()
    .url()
    .max(2000)
    .optional()
    .describe("Optional source URL where activity info was found."),
  sourceName: z
    .string()
    .max(200)
    .optional()
    .describe("Optional source name (e.g. 'TripAdvisor', 'Lonely Planet')."),
  ...googlePlaceCreateFields,
});

export const updateItineraryActivityInputSchema = z.object({
  orderIndex: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Optional new order position in the day."),
  title: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe("Optional new activity title."),
  description: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .describe("Optional new description; use null to clear."),
  startTime: timeSchema
    .nullable()
    .optional()
    .describe("Optional new start time (HH:mm); use null to clear."),
  endTime: timeSchema
    .nullable()
    .optional()
    .describe("Optional new end time (HH:mm); use null to clear."),
  location: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .describe("Optional new location; use null to clear."),
  locationUrl: z
    .string()
    .url()
    .max(2000)
    .nullable()
    .optional()
    .describe("Optional new location URL; use null to clear."),
  estimatedCostInCents: z
    .number()
    .int()
    .min(0)
    .nullable()
    .optional()
    .describe("Optional new estimated cost in cents; use null to clear."),
  imageUrl: z
    .string()
    .url()
    .max(2000)
    .nullable()
    .optional()
    .describe("Optional new image URL; use null to clear."),
  sourceUrl: z
    .string()
    .url()
    .max(2000)
    .nullable()
    .optional()
    .describe("Optional new source URL; use null to clear."),
  sourceName: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .describe("Optional new source name; use null to clear."),
  ...googlePlaceUpdateFields,
});
