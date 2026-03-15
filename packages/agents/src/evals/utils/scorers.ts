/**
 * Custom scorers for TripLoom agent evaluations.
 *
 * These extend vitest-evals' built-in scorers with domain-specific checks
 * for routing sequences, anti-parroting, and trip state management.
 */

import { ChatOpenAI } from "@langchain/openai";
import type { Score, ScoreFn, BaseScorerOptions, ToolCall } from "vitest-evals";

// ---------------------------------------------------------------------------
// Tool Sequence Scorer
// ---------------------------------------------------------------------------

interface ToolSequenceScorerOptions extends BaseScorerOptions {
  /**
   * Expected tool calls in strict order. Each entry checks name and
   * optionally a subset of arguments.
   */
  expectedToolSequence?: Array<{
    name: string;
    arguments?: Record<string, unknown>;
  }>;
}

/**
 * Validates that the supervisor made tool calls in a specific order.
 *
 * Unlike ToolCallScorer (which checks presence), this scorer verifies
 * both order and argument subsets. Useful for state management evals
 * where `update_trip` MUST come before `transfer_to_*`.
 */
export function ToolSequenceScorer(): ScoreFn<ToolSequenceScorerOptions> {
  return async (opts: ToolSequenceScorerOptions): Promise<Score> => {
    if (!opts.expectedToolSequence) {
      return {
        score: null,
        metadata: { rationale: "Skipped: no expectedToolSequence" },
      };
    }

    const actual = opts.toolCalls ?? [];
    const expected = opts.expectedToolSequence;

    if (actual.length === 0) {
      return {
        score: 0,
        metadata: { rationale: "No tool calls made", actual, expected },
      };
    }

    let matchedCount = 0;
    let actualIdx = 0;

    for (const exp of expected) {
      // Find the next matching tool call in the actual sequence
      let found = false;
      while (actualIdx < actual.length) {
        const act = actual[actualIdx];
        actualIdx++;

        if (act.name !== exp.name) continue;

        // Check argument subset if specified
        if (exp.arguments) {
          const argsMatch = Object.entries(exp.arguments).every(
            ([key, val]) => {
              const actualArgs = act.arguments ?? {};
              if (val instanceof RegExp) {
                return (
                  typeof actualArgs[key] === "string" &&
                  val.test(actualArgs[key])
                );
              }
              return actualArgs[key] === val;
            },
          );
          if (!argsMatch) continue;
        }

        found = true;
        matchedCount++;
        break;
      }

      if (!found) break;
    }

    const score = matchedCount / expected.length;
    const rationale =
      score === 1
        ? "All expected tools called in order with matching arguments"
        : `Matched ${matchedCount}/${expected.length} tools in sequence`;

    return {
      score,
      metadata: {
        rationale,
        expectedSequence: expected.map((e) => e.name),
        actualSequence: actual.map((a: ToolCall) => a.name),
      },
    };
  };
}

// ---------------------------------------------------------------------------
// No Transfer Scorer
// ---------------------------------------------------------------------------

interface NoTransferScorerOptions extends BaseScorerOptions {
  /**
   * Set to true to assert that the supervisor does NOT make a transfer call.
   */
  expectNoTransfer?: boolean;
}

/**
 * Asserts that the supervisor did NOT transfer to any sub-agent.
 *
 * Used for blocking-question evals: when the supervisor should ask the
 * user for clarification instead of delegating.
 */
export function NoTransferScorer(): ScoreFn<NoTransferScorerOptions> {
  return async (opts: NoTransferScorerOptions): Promise<Score> => {
    if (!opts.expectNoTransfer) {
      return {
        score: null,
        metadata: { rationale: "Skipped: expectNoTransfer not set" },
      };
    }

    const transfers = (opts.toolCalls ?? []).filter((tc: ToolCall) =>
      tc.name.startsWith("transfer_to_"),
    );

    if (transfers.length === 0) {
      return {
        score: 1,
        metadata: {
          rationale: "Correctly did not transfer — asked for clarification",
        },
      };
    }

    return {
      score: 0,
      metadata: {
        rationale: `Incorrectly transferred to ${transfers.map((t: ToolCall) => t.name).join(", ")} instead of asking the user`,
        transfers,
      },
    };
  };
}

// ---------------------------------------------------------------------------
// Output Brevity Scorer (Anti-Parroting)
// ---------------------------------------------------------------------------

interface BrevityScorerOptions extends BaseScorerOptions {
  /**
   * Maximum allowed character count for the supervisor's text response.
   * Defaults to 500 — roughly 2-3 short sentences.
   */
  maxLength?: number;
}

/**
 * Heuristic scorer that checks if the supervisor response is short enough
 * to pass the anti-parroting rules (max 1 ack + 1 question).
 *
 * This is a fast, cheap alternative to LLM-as-judge for catching
 * obvious parroting violations. Pair with LLMJudgeScorer for nuance.
 */
export function BrevityScorer(
  defaultMaxLength = 500,
): ScoreFn<BrevityScorerOptions> {
  return async (opts: BrevityScorerOptions): Promise<Score> => {
    const maxLen = opts.maxLength ?? defaultMaxLength;
    const text = opts.output ?? "";

    if (text.length === 0) {
      // No text is fine — supervisor may have only made tool calls
      return {
        score: 1,
        metadata: { rationale: "No text output (tool-call only response)" },
      };
    }

    if (text.length <= maxLen) {
      return {
        score: 1,
        metadata: {
          rationale: `Response length ${text.length} chars is within limit of ${maxLen}`,
        },
      };
    }

    // Proportional scoring: slightly over is better than way over
    const ratio = maxLen / text.length;
    return {
      score: Math.max(0, ratio),
      metadata: {
        rationale: `Response too long: ${text.length} chars exceeds limit of ${maxLen}`,
        responseLength: text.length,
      },
    };
  };
}

// ---------------------------------------------------------------------------
// LLM-as-Judge Scorer
// ---------------------------------------------------------------------------

interface LLMJudgeScorerOptions extends BaseScorerOptions {
  /**
   * Additional context for the judge (e.g., specialist output that preceded
   * the supervisor's response).
   */
  context?: string;
}

interface LLMJudgeConfig {
  /** The judging criteria prompt. Should instruct the LLM to return a 0-1 score. */
  criteria: string;
  /** Model name for the judge. Defaults to gpt-4.1-mini. */
  model?: string;
}

/**
 * Generic LLM-as-judge scorer. Sends the supervisor's output + criteria
 * to a judge LLM and returns its score.
 *
 * @example
 * ```ts
 * LLMJudgeScorer({
 *   criteria: `Score whether the response avoids restating specialist content.
 *   1.0 = Short ack + question only. 0.0 = Fully restates specialist output.`,
 * })
 * ```
 */
export function LLMJudgeScorer(
  config: LLMJudgeConfig,
): ScoreFn<LLMJudgeScorerOptions> {
  const modelName = config.model ?? "gpt-4.1-mini";

  return async (opts: LLMJudgeScorerOptions): Promise<Score> => {
    const judge = new ChatOpenAI({
      model: modelName,
      temperature: 0,
      useResponsesApi: true,
    });

    const prompt = `You are an evaluation judge. Score the following AI assistant response on a scale of 0 to 1.

CRITERIA:
${config.criteria}

USER INPUT:
${opts.input}

${opts.context ? `CONTEXT:\n${opts.context}\n` : ""}
ASSISTANT RESPONSE:
${opts.output}

Respond with ONLY a JSON object: {"score": <number 0-1>, "rationale": "<brief explanation>"}`;

    const response = await judge.invoke([{ role: "user", content: prompt }]);
    const text =
      typeof response.content === "string"
        ? response.content
        : Array.isArray(response.content)
          ? response.content
              .filter(
                (c): c is { type: "text"; text: string } =>
                  typeof c === "object" &&
                  c !== null &&
                  "type" in c &&
                  c.type === "text",
              )
              .map((c) => c.text)
              .join("\n")
          : "";

    try {
      // Extract JSON from the response (may be wrapped in markdown code fences)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(1, Math.max(0, parsed.score)),
        metadata: { rationale: parsed.rationale },
      };
    } catch {
      return {
        score: null,
        metadata: { rationale: `Judge returned unparseable response: ${text}` },
      };
    }
  };
}

// ---------------------------------------------------------------------------
// No IDs Exposed Scorer
// ---------------------------------------------------------------------------

/**
 * Checks that the supervisor's text response does not contain internal IDs.
 * Matches patterns like UUIDs, nanoid-style strings, and common ID prefixes.
 */
export function NoIDsExposedScorer(): ScoreFn {
  const ID_PATTERNS = [
    // UUIDs
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    // Nanoid-style (21+ chars alphanumeric with dashes/underscores)
    /\b[A-Za-z0-9_-]{21,}\b/,
    // Prefixed IDs like dest-, trip-, call_
    /\b(?:dest|trip|call|fc|resp|run)-[A-Za-z0-9_-]{6,}\b/,
  ];

  return async (opts: BaseScorerOptions): Promise<Score> => {
    const text = opts.output ?? "";
    if (!text) {
      return { score: 1, metadata: { rationale: "No text output to check" } };
    }

    const violations: string[] = [];
    for (const pattern of ID_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        violations.push(match[0]);
      }
    }

    if (violations.length === 0) {
      return {
        score: 1,
        metadata: { rationale: "No internal IDs found in response" },
      };
    }

    return {
      score: 0,
      metadata: {
        rationale: `Found internal IDs in response: ${violations.join(", ")}`,
        violations,
      },
    };
  };
}
