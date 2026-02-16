import { z } from "zod";
import {
  cabinClassEnum,
  priceRangeEnum,
  travelInterestEnum,
  regionEnum,
} from "../db/schema";

// Enum values derived from DB schema
export const cabinClassValues = cabinClassEnum.enumValues;
export const budgetRangeValues = priceRangeEnum.enumValues;
export const travelInterestValues = travelInterestEnum.enumValues;
export const regionValues = regionEnum.enumValues;

// Zod schemas for enums
export const travelInterestSchema = z.enum(travelInterestValues);
export const regionSchema = z.enum(regionValues);

// Types derived from schemas
export type TravelInterest = z.infer<typeof travelInterestSchema>;
export type Region = z.infer<typeof regionSchema>;

// Response schema - what the API returns
export const userPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  preferredCabinClass: z.enum(cabinClassValues).nullable(),
  budgetRange: z.enum(budgetRangeValues).nullable(),
  travelInterests: z.array(travelInterestSchema),
  preferredRegions: z.array(regionSchema),
  dietaryRestrictions: z.array(z.string()),
  accessibilityNeeds: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserPreferenceDTO = z.infer<typeof userPreferenceSchema>;

// Input schema for create/update
export const userPreferenceInputSchema = z.object({
  preferredCabinClass: z.enum(cabinClassValues).nullable().optional(),
  budgetRange: z.enum(budgetRangeValues).nullable().optional(),
  travelInterests: z.array(travelInterestSchema).optional(),
  preferredRegions: z.array(regionSchema).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  accessibilityNeeds: z.string().nullable().optional(),
});

export type UserPreferenceInput = z.infer<typeof userPreferenceInputSchema>;
