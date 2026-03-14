import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";
import * as CallbackManagerModule from "@langchain/core/callbacks/manager";

let instrumented = false;

/**
 * Instruments all LangChain/LangGraph operations with OpenInference so they
 * emit OTEL spans: supervisor routing, sub-agent execution, tool calls, LLM
 * invocations with token usage, chain execution order and timing.
 *
 * This does NOT register a TracerProvider — the host process (API server)
 * owns the global provider. Spans created by OpenInference flow through
 * whatever provider the host has registered.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function instrumentLangChain() {
  if (instrumented) return;
  instrumented = true;

  const instrumentation = new LangChainInstrumentation();
  instrumentation.manuallyInstrument(CallbackManagerModule);
}
