import { z } from "zod";

const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

function normalizeQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.at(-1);
  }

  return value;
}

export const googlePlaceSummarySchema = z.object({
  placeId: z.string(),
  displayName: z.string(),
  formattedAddress: z.string().nullable(),
  mapsUrl: z.string().url().nullable(),
  lat: latitudeSchema.nullable(),
  lng: longitudeSchema.nullable(),
});

export type GooglePlaceSummary = z.infer<typeof googlePlaceSummarySchema>;

export const googlePlaceDetailsSchema = googlePlaceSummarySchema.extend({
  primaryType: z.string().nullable(),
});

export type GooglePlaceDetails = z.infer<typeof googlePlaceDetailsSchema>;

export const googlePlacePhotoSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  authorName: z.string().nullable(),
  authorUrl: z.string().url().nullable(),
});

export type GooglePlacePhoto = z.infer<typeof googlePlacePhotoSchema>;

export const googlePlaceReviewSchema = z.object({
  rating: z.number().nullable(),
  text: z.string().nullable(),
  publishTime: z.string().nullable(),
  relativePublishTimeDescription: z.string().nullable(),
  authorName: z.string().nullable(),
  authorUrl: z.string().url().nullable(),
});

export type GooglePlaceReview = z.infer<typeof googlePlaceReviewSchema>;

export const googlePlaceEnrichedDetailsSchema = googlePlaceDetailsSchema.extend({
  websiteUrl: z.string().url().nullable(),
  phoneNumber: z.string().nullable(),
  rating: z.number().nullable(),
  userRatingCount: z.number().int().nullable(),
  businessStatus: z.string().nullable(),
  isOpenNow: z.boolean().nullable(),
  weekdayDescriptions: z.array(z.string()),
  editorialSummary: z.string().nullable(),
  reviewSummary: z.string().nullable(),
  photos: z.array(googlePlacePhotoSchema),
  reviews: z.array(googlePlaceReviewSchema),
});

export type GooglePlaceEnrichedDetails = z.infer<
  typeof googlePlaceEnrichedDetailsSchema
>;

export const searchPlacesInputSchema = z.object({
  query: z.string().min(1).max(500),
  destination: z.string().min(1).max(200).optional(),
  pageSize: z.number().int().min(1).max(10).optional().default(5),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  radiusMeters: z.number().min(1).max(50_000).optional(),
  languageCode: z.string().min(2).max(10).optional(),
  regionCode: z.string().length(2).optional(),
});

export type SearchPlacesInput = z.infer<typeof searchPlacesInputSchema>;

export const searchPlacesQuerySchema = z.object({
  query: z.preprocess(normalizeQueryValue, z.string().min(1).max(500)),
  destination: z.preprocess(
    normalizeQueryValue,
    z.string().min(1).max(200).optional(),
  ),
  pageSize: z.coerce.number().int().min(1).max(10).optional().default(5),
  latitude: z.preprocess(normalizeQueryValue, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(
    normalizeQueryValue,
    z.coerce.number().min(-180).max(180).optional(),
  ),
  radiusMeters: z.preprocess(
    normalizeQueryValue,
    z.coerce.number().min(1).max(50_000).optional(),
  ),
  languageCode: z.preprocess(
    normalizeQueryValue,
    z.string().min(2).max(10).optional(),
  ),
  regionCode: z.preprocess(normalizeQueryValue, z.string().length(2).optional()),
});

export const getPlaceDetailsInputSchema = z.object({
  placeId: z.string().min(1),
  languageCode: z.string().min(2).max(10).optional(),
  regionCode: z.string().length(2).optional(),
});

export type GetPlaceDetailsInput = z.infer<typeof getPlaceDetailsInputSchema>;

export const getPlaceDetailsQuerySchema = z.object({
  languageCode: z.preprocess(
    normalizeQueryValue,
    z.string().min(2).max(10).optional(),
  ),
  regionCode: z.preprocess(normalizeQueryValue, z.string().length(2).optional()),
});
