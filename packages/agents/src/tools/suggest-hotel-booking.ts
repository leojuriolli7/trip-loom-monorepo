import { tool } from "@langchain/core/tools";
import { z } from "zod";

const schema = z.object({
  hotels: z
    .array(
      z.object({
        id: z.string().describe("The hotel ID from the search results"),
        name: z.string().describe("Hotel name"),
        starRating: z.number().describe("Star rating (1-5)"),
        pricePerNight: z.number().describe("Price per night"),
        currency: z.string().describe("Currency code (e.g. USD, EUR)"),
        location: z.string().describe("Hotel location or neighborhood"),
        amenities: z
          .array(z.string())
          .optional()
          .describe("Key amenities (e.g. pool, WiFi, breakfast)"),
      }),
    )
    .min(1)
    .describe("The list of hotels to present to the user"),
});

/**
 * Records hotel suggestions via the tool-call trace.
 * Call this after searching hotels so the frontend can render
 * structured tool-call payloads from persisted history.
 */
export const suggestHotelBookingTool = tool(
  async (input) => {
    return `Presented ${input.hotels.length} hotel option(s) to the user for selection.`;
  },
  {
    name: "suggest_hotel_booking",
    description:
      "Present hotel options to the user as a visual comparison widget. Use this after searching hotels to let the user compare and pick one.",
    schema,
  },
);
