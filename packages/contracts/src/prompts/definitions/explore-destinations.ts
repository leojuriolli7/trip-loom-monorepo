import type { PromptDefinition } from "../types";

export const exploreDestinationsPrompt = {
  name: "explore_destinations",
  title: "Explore Destinations",
  description:
    "Discover interesting travel destinations based on your preferences",
  parts: [
    {
      type: "text",
      text: "I'd like to explore travel destinations. Show me interesting places I might enjoy",
    },
    {
      type: "arg",
      name: "interests",
      description: "Types of experiences you are looking for",
      required: false,
      prefix: ", especially for ",
      suffix: "",
    },
    {
      type: "arg",
      name: "timeframe",
      description: "When you are planning to travel",
      required: false,
      prefix: ". I'm thinking about traveling around ",
      suffix: "",
    },
    { type: "text", text: "." },
  ],
} satisfies PromptDefinition;
