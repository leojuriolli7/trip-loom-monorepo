import type { PromptDefinition } from "@trip-loom/contracts/prompts";
import { useEffect } from "react";

const SET_PROMPT_EVENT = "triploom:set-prompt";
const CLEAR_PROMPT_EVENT = "triploom:clear-prompt";

export type SetPromptPayload = {
  definition: PromptDefinition;
  /** Pre-filled values for required (or known) args. */
  prefilledArgs?: Record<string, string>;
};

export function dispatchSetPrompt(
  definition: PromptDefinition,
  prefilledArgs?: Record<string, string>,
) {
  window.dispatchEvent(
    new CustomEvent<SetPromptPayload>(SET_PROMPT_EVENT, {
      detail: { definition, prefilledArgs },
    }),
  );
}

export function dispatchClearPrompt() {
  window.dispatchEvent(new CustomEvent(CLEAR_PROMPT_EVENT));
}

export function useOnSetPrompt(callback: (payload: SetPromptPayload) => void) {
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SetPromptPayload>).detail;
      callback(detail);
    };

    window.addEventListener(SET_PROMPT_EVENT, handler);
    return () => window.removeEventListener(SET_PROMPT_EVENT, handler);
  }, [callback]);
}

export function useOnClearPrompt(callback: () => void) {
  useEffect(() => {
    window.addEventListener(CLEAR_PROMPT_EVENT, callback);
    return () => window.removeEventListener(CLEAR_PROMPT_EVENT, callback);
  }, [callback]);
}
