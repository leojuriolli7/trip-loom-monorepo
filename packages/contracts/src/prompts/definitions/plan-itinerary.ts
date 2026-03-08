import type { PromptDefinition } from "../types";

export const planItineraryPrompt = {
  name: "plan_itinerary",
  title: "Plan Itinerary",
  description:
    "Create a detailed day-by-day itinerary with activities and sightseeing",
  parts: [
    { type: "text", text: "Help me plan an itinerary" },
    {
      type: "arg",
      name: "destination",
      description: "The destination for the itinerary",
      required: false,
      prefix: " for ",
      suffix: "",
    },
    {
      type: "arg",
      name: "days",
      description: "How many days the itinerary should cover",
      required: false,
      prefix: ", covering ",
      suffix: " days",
    },
    {
      type: "text",
      text: ". Include activities, restaurants, and sightseeing.",
    },
  ],
} satisfies PromptDefinition;
