import type { PromptDefinition } from "../types";

export const planTripToDestinationPrompt = {
  name: "plan_trip_to_destination",
  title: "Plan a Trip",
  description:
    "Plan a full trip to a specific destination with flights, hotels, and itinerary",
  parts: [
    { type: "text", text: "I'd like to plan a trip to " },
    {
      type: "arg",
      name: "destinationName",
      description: "The destination to plan a trip to",
      required: true,
    },
    {
      type: "text",
      text: ". Help me find flights, hotels, and create an itinerary",
    },
    {
      type: "arg",
      name: "startDate",
      description: "When the trip starts",
      required: false,
      prefix: " from ",
      suffix: "",
    },
    {
      type: "arg",
      name: "endDate",
      description: "When the trip ends",
      required: false,
      prefix: " to ",
      suffix: "",
    },
    { type: "text", text: "." },
  ],
} satisfies PromptDefinition;
