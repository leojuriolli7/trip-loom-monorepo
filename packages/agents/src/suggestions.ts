import { z } from "zod";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { createModel, modelConfig } from "./config";

/*
 * Eventually after testing, we can see if it's valid to pass the entire trip object here,
 * but for now, this is enough.
 */
export interface SuggestionsContext {
  messages: BaseMessage[];
  tripStatus?: string;
  destinationName?: string;
}

const suggestionsSchema = z.object({
  suggestions: z
    .array(z.string().max(60))
    .length(4)
    .describe("Exactly 4 short follow-up prompts the user might ask next"),
});

const SYSTEM_PROMPT = `You generate follow-up prompt suggestions for a travel planning chat assistant called TripLoom.

Given the recent conversation and trip context, produce exactly 4 short, actionable prompts the user might want to ask next. Each suggestion should be a natural question or request (not a command), written in first person from the user's perspective.

Rules:
- Keep each suggestion under 60 characters
- Make them contextually relevant to what just happened in the conversation
- Cover different next steps (don't repeat the same intent)
- Use plain travel language, no technical terms or IDs
- If the trip status is "current", favor real-time questions (weather, opening hours, nearby places)
- If the trip status is "draft", favor exploration (destinations, dates, preferences)
- If the trip status is "upcoming", favor planning (flights, hotels, itinerary)
- If the trip status is "past", favor reflection or new planning (similar destinations, new trip)`;

/**
 * Extracts plain text from a LangChain message content field.
 *
 * Message content can be a plain string or an array of content blocks
 * (text, image_url, etc.). We only care about text blocks here.
 */
function getTextContent(message: BaseMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (!Array.isArray(message.content)) {
    return "";
  }

  return message.content
    .filter(
      (block): block is { type: "text"; text: string } =>
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        block.type === "text",
    )
    .map((block) => block.text)
    .join("");
}

/**
 * Builds a condensed conversation transcript from the last few messages.
 *
 * Filters to only human and AI messages (skipping system, tool, and
 * function messages), takes the last 6, and formats as "User: ..." /
 * "Assistant: ..." lines. Messages with no text content are dropped.
 */
function formatRecentConversation(messages: BaseMessage[]): string {
  return messages
    .filter((m) => HumanMessage.isInstance(m) || AIMessage.isInstance(m))
    .slice(-6)
    .map((m) => {
      const text = getTextContent(m).trim();
      if (!text) return null;

      const role = HumanMessage.isInstance(m) ? "User" : "Assistant";
      return `${role}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildContextLine(ctx: SuggestionsContext): string {
  const parts: string[] = [];

  if (ctx.tripStatus) {
    parts.push(`Trip status: ${ctx.tripStatus}`);
  }

  if (ctx.destinationName) {
    parts.push(`Destination: ${ctx.destinationName}`);
  }

  return parts.length > 0 ? `\nTrip context: ${parts.join(". ")}.` : "";
}

export async function generateSuggestions(
  ctx: SuggestionsContext,
): Promise<string[]> {
  const conversationText = formatRecentConversation(ctx.messages);

  if (!conversationText) {
    return [];
  }

  const userPrompt = `Recent conversation:\n${conversationText}${buildContextLine(ctx)}`;

  const model = createModel(modelConfig.suggestions, {
    temperature: 0.7,
  }).withStructuredOutput(suggestionsSchema);

  try {
    const result = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    return result.suggestions.slice(0, 4);
  } catch {
    return [];
  }
}
