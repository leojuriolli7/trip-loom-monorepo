import { DynamicStructuredTool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

export type ToolApprovalInterrupt = {
  type: "tool-approval";
  toolName: string;
  args: Record<string, unknown>;
};

export const toolApprovalResumeSchema = z.discriminatedUnion("approved", [
  z.object({ approved: z.literal(true) }),
  z.object({ approved: z.literal(false), message: z.string().optional() }),
]);

export type ToolApprovalResume = z.infer<typeof toolApprovalResumeSchema>;

/**
 * Wraps an MCP tool with an interrupt-based approval flow.
 * The wrapper keeps the same name/schema so the agent uses it identically.
 * On invocation it pauses for user approval; on approve it executes the original tool.
 */
export function withApproval(mcpTool: DynamicStructuredTool): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: mcpTool.name,
    description: mcpTool.description,
    schema: mcpTool.schema,
    func: async (input) => {
      const event: ToolApprovalInterrupt = {
        type: "tool-approval",
        toolName: mcpTool.name,
        args: input,
      };

      const decision = toolApprovalResumeSchema.parse(interrupt(event));

      if (decision.approved) {
        return mcpTool.invoke(input);
      }

      return decision.message
        ? `User rejected this action. Feedback: "${decision.message}". Adjust your approach based on their feedback.`
        : "User rejected this action. Ask the user what they'd like instead.";
    },
  });
}
