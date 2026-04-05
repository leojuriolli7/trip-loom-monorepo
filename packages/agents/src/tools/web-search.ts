import { tool } from "@langchain/core/tools";
import type { Response } from "openai/resources/responses/responses";
import { z } from "zod";
import { openai } from "../lib/openai";

const DEFAULT_WEB_SEARCH_MODEL = "gpt-5-mini";

interface WebSearchUserLocation {
  type: "approximate";
  city?: string;
  country?: string;
  region?: string;
  timezone?: string;
}

interface WebSearchResultSource {
  title: string;
  url: string;
}

interface WebSearchToolConfig {
  model?: string;
  searchContextSize?: "low" | "medium" | "high";
  allowedDomains?: string[];
  userLocation?: WebSearchUserLocation;
}

const webSearchToolInputSchema = z.object({
  query: z.string().min(1).max(500).describe("The web search query to run."),
});

function extractSources(response: Response) {
  const citations = new Map<string, WebSearchResultSource>();

  for (const item of response.output) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content) {
      if (content.type !== "output_text") {
        continue;
      }

      for (const annotation of content.annotations ?? []) {
        if (annotation.type !== "url_citation") {
          continue;
        }

        citations.set(annotation.url, {
          title: annotation.title,
          url: annotation.url,
        });
      }
    }
  }

  if (citations.size > 0) {
    return [...citations.values()];
  }

  for (const item of response.output) {
    if (item.type !== "web_search_call" || item.action.type !== "search") {
      continue;
    }

    for (const source of item.action.sources ?? []) {
      citations.set(source.url, {
        title: source.url,
        url: source.url,
      });
    }
  }

  return [...citations.values()];
}

/**
 * TODO:
 * Later, we should decide between either accepting `queries: string[]`, or collapsing all subsequent
 * web search tool calls into one tool call card in the UI, since the agents call many web searches at once,
 * and it clutters our UI.
 */
function createWebSearchTool(config: WebSearchToolConfig = {}) {
  const {
    model = process.env.WEB_SEARCH_MODEL ?? DEFAULT_WEB_SEARCH_MODEL,
    searchContextSize,
    allowedDomains,
    userLocation,
  } = config;

  return tool(
    async ({ query }) => {
      try {
        const response = await openai.responses.create({
          model,
          input: query,
          include: ["web_search_call.action.sources"],
          tool_choice: "required",
          tools: [
            {
              type: "web_search" as const,
              filters: allowedDomains?.length
                ? { allowed_domains: allowedDomains }
                : undefined,
              search_context_size: searchContextSize,
              user_location: userLocation,
            },
          ],
        });

        return JSON.stringify({
          query,
          text: response.output_text,
          sources: extractSources(response),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return JSON.stringify({
          query,
          text: `Web search failed: ${message}`,
          sources: [],
        });
      }
    },
    {
      name: "web_search",
      description:
        "Search the web for current information. Use this for up-to-date facts, travel research, opening hours, local practicalities, and anything that may have changed recently.",
      schema: webSearchToolInputSchema,
    },
  );
}

export const webSearchTool = createWebSearchTool();
