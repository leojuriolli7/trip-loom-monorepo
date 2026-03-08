import { z } from "zod";

// ============================================================================
// Prompt parts — structured template segments
// ============================================================================

export const promptTextPartSchema = z.object({
  type: z.literal("text"),
  /** Static text rendered as-is */
  text: z.string(),
});

export type PromptTextPart = z.infer<typeof promptTextPartSchema>;

export const promptArgPartSchema = z.object({
  type: z.literal("arg"),
  /** Argument identifier */
  name: z.string(),
  /** Human-readable description of the argument */
  description: z.string(),
  /** Whether this argument must be filled before submission */
  required: z.boolean(),
  /** Text prepended when the argument has a value */
  prefix: z.string().optional(),
  /** Text appended when the argument has a value */
  suffix: z.string().optional(),
});

export type PromptArgPart = z.infer<typeof promptArgPartSchema>;

export const promptPartSchema = z.union([
  promptTextPartSchema,
  promptArgPartSchema,
]);

export type PromptPart = z.infer<typeof promptPartSchema>;

// ============================================================================
// Prompt definition
// ============================================================================

export const promptDefinitionSchema = z.object({
  /** Unique identifier (snake_case) */
  name: z.string(),
  /** Human-readable title */
  title: z.string(),
  /** Short description of what this prompt does */
  description: z.string(),
  /** Ordered template segments — static text interleaved with argument slots */
  parts: z.array(promptPartSchema),
});

export type PromptDefinition = z.infer<typeof promptDefinitionSchema>;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extracts all argument parts from a prompt definition
 */
export function getPromptArgs(definition: PromptDefinition): PromptArgPart[] {
  return definition.parts.filter((p): p is PromptArgPart => p.type === "arg");
}

const WHITESPACE_RE = /\s+/g;

/**
 * Renders a prompt by concatenating its parts
 *
 * - Text parts are always included
 * - Required arg parts use the provided value (empty string if missing)
 * - Optional arg parts are skipped entirely (including prefix/suffix) when
 *   no value is provided
 */
export function renderPrompt(
  definition: PromptDefinition,
  args: Record<string, string | undefined>,
): string {
  let result = "";

  for (const part of definition.parts) {
    if (part.type === "text") {
      result += part.text;
      continue;
    }

    const value = args[part.name]?.trim();

    if (!value && !part.required) {
      continue;
    }

    result += (part.prefix ?? "") + (value ?? "") + (part.suffix ?? "");
  }

  return result.replace(WHITESPACE_RE, " ").trim();
}
