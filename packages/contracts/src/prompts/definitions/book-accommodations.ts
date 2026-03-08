import type { PromptDefinition } from "../types";

export const bookAccommodationsPrompt = {
  name: "book_accommodations",
  title: "Book Accommodations",
  description: "Find and book hotels that match your preferences",
  parts: [
    { type: "text", text: "Help me find and book accommodations" },
    {
      type: "arg",
      name: "destination",
      description: "Where you want to stay",
      required: false,
      prefix: " in ",
      suffix: "",
    },
    {
      type: "arg",
      name: "preferences",
      description: "What you are looking for in a hotel",
      required: false,
      prefix: ". I'd prefer something ",
      suffix: "",
    },
    { type: "text", text: "." },
  ],
} satisfies PromptDefinition;
