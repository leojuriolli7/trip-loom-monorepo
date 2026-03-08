import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import {
  PROMPT_DEFINITIONS,
  getPromptArgs,
  renderPrompt,
} from "@trip-loom/contracts/prompts";

/**
 * Registers all shared prompt definitions on the MCP server.
 *
 * Prompts don't need an API client — they are pure templates
 * that produce user messages for the agent.
 */
export function registerPrompts(server: McpServer) {
  for (const prompt of PROMPT_DEFINITIONS) {
    const args = getPromptArgs(prompt);
    const zodShape: Record<string, z.ZodType> = {};

    for (const arg of args) {
      let schema: z.ZodType = z.string().describe(arg.description);

      if (!arg.required) {
        schema = schema.optional();
      }

      zodShape[arg.name] = schema;
    }

    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
        argsSchema: zodShape,
      },
      async (resolvedArgs) => ({
        description: prompt.description,
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: renderPrompt(
                prompt,
                resolvedArgs as Record<string, string | undefined>,
              ),
            },
          },
        ],
      }),
    );
  }
}
