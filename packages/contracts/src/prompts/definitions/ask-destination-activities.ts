import type { PromptDefinition } from "../types";

export const askDestinationActivitiesPrompt = {
  name: "ask_destination_activities",
  title: "Ask About Activities",
  description:
    "Learn about the best activities, attractions, and things to do at a destination",
  parts: [
    { type: "text", text: "I want to know more about " },
    {
      type: "arg",
      name: "destinationName",
      description: "The destination to ask about",
      required: true,
    },
    {
      type: "text",
      text: ", what are the key places to visit and what are the highlights?",
    },
    {
      type: "arg",
      name: "interest",
      description: "Specific type of activities you are interested in",
      required: false,
      prefix: " Specifically ",
      suffix: ".",
    },
    {
      type: "arg",
      name: "timeframe",
      description: "When you are planning to visit",
      required: false,
      prefix: " I am planning a visit around ",
      suffix: ".",
    },
  ],
} satisfies PromptDefinition;
