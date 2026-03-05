import { hotelSummarySchema } from "@trip-loom/api/dto";
import z from "zod";

export const suggestHotelBookingArgsSchema = z.object({
  hotels: z
    .array(
      hotelSummarySchema.pick({ id: true, name: true }).extend({
        imageUrl: z.string().trim().optional().default(""),
        starRating: z.number().min(0).max(5),
        pricePerNight: z.number().min(0),
        currency: z.string().trim().min(1),
        location: z.string().trim().min(1),
        amenities: z.array(z.string().trim().min(1)).default([]),
      }),
    )
    .min(1),
});

export type SuggestHotelBookingArgs = z.infer<
  typeof suggestHotelBookingArgsSchema
>;
export type SuggestedHotel = SuggestHotelBookingArgs["hotels"][number];
