/**
 * Output quality evals — verify anti-parroting, brevity, and no ID leaks.
 *
 * Uses LLM-as-judge and heuristic scorers to evaluate the supervisor's
 * user-facing text responses after a specialist returns.
 */

import { describeEval } from "vitest-evals";
import {
  SupervisorRunner,
  BrevityScorer,
  LLMJudgeScorer,
  NoIDsExposedScorer,
  DESTINATION_RESULTS_HISTORY,
} from "./utils";

// ---------------------------------------------------------------------------
// Anti-parroting after specialist
// ---------------------------------------------------------------------------

describeEval("output quality — anti-parroting after destination suggestions", {
  data: async () => [
    {
      name: "supervisor response after destination_agent returns",
      // The history already includes the specialist returning with suggestions.
      // The supervisor should respond with a short ack + question, not restate the list.
      input:
        "I'm looking for warm places for a short March trip from NYC. Somewhere walkable with good food.",
    },
  ],
  task: SupervisorRunner({ history: DESTINATION_RESULTS_HISTORY }),
  scorers: [
    BrevityScorer(400),
    LLMJudgeScorer({
      criteria: `Score whether the supervisor's response avoids restating the specialist's destination list.
The specialist already showed the user 3 destination suggestions via a UI widget.

1.0 = Response is at most 1-2 short sentences: a brief acknowledgement and/or a follow-up question. Does NOT list the destinations again.
0.7 = Response is brief but mentions some destination details unnecessarily.
0.3 = Response partially restates the destination list or gives a mini-summary of each.
0.0 = Response fully restates the specialist's output, listing all destinations with details.`,
    }),
  ],
  threshold: 0.6,
  timeout: 60_000,
});

// ---------------------------------------------------------------------------
// No internal IDs exposed
// ---------------------------------------------------------------------------

describeEval("output quality — no internal IDs in user-facing text", {
  data: async () => [
    {
      name: "supervisor response should not contain IDs",
      input: "Let's go with Barcelona.",
    },
  ],
  task: SupervisorRunner({ history: DESTINATION_RESULTS_HISTORY }),
  scorers: [NoIDsExposedScorer()],
  threshold: 1.0,
  timeout: 60_000,
});
