import { z } from "zod";

export const suggestionsResponseSchema = z.object({
  suggestions: z.array(z.string()),
});

export type SuggestionsResponse = z.infer<typeof suggestionsResponseSchema>;
