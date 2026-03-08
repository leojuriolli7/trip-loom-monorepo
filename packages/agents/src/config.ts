import { ChatOpenAI } from "@langchain/openai";

/**
 * Default models used when no env var override is set.
 */
const DEFAULT_MODEL = "gpt-5.2";
const SUGGESTIONS_MODEL = "gpt-4.1-mini";

/**
 * Per-agent model configuration via environment variables.
 * Falls back to DEFAULT_MODEL if unset.
 */
export const modelConfig = {
  supervisor: process.env.SUPERVISOR_MODEL ?? DEFAULT_MODEL,
  destination: process.env.DESTINATION_AGENT_MODEL ?? DEFAULT_MODEL,
  flight: process.env.FLIGHT_AGENT_MODEL ?? DEFAULT_MODEL,
  hotel: process.env.HOTEL_AGENT_MODEL ?? DEFAULT_MODEL,
  itinerary: process.env.ITINERARY_AGENT_MODEL ?? DEFAULT_MODEL,
  suggestions: process.env.SUGGESTIONS_MODEL ?? SUGGESTIONS_MODEL,
} as const;

/**
 * Creates a ChatOpenAI instance for the given model name.
 * Temperature is low by default for reliable tool calling.
 */
export function createModel(
  model: string,
  options?: { temperature?: number },
): ChatOpenAI {
  return new ChatOpenAI({
    model,
    useResponsesApi: true,
    temperature: options?.temperature ?? 0.1,
  });
}
