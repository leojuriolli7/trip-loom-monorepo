import { z } from "zod";
import type { TripLoomToolCall } from "@trip-loom/agents";

// Request body for POST /api/trips/:id/chat
// Expected shape from LangGraph FetchStreamTransport.
export const chatInputSchema = z
  .object({
    input: z.unknown().optional().nullable(),
    context: z.record(z.string(), z.unknown()).optional(),
    command: z
      .object({
        resume: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
  })
  .refine((data) => data.input != null || data.command?.resume !== undefined, {
    message: "Either input or command.resume is required",
  });

export type ChatInput = z.infer<typeof chatInputSchema>;

const chatToolCallSchema = z.custom<TripLoomToolCall>();

const chatMessageContentPartSchema = z.union([
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("image_url"),
    image_url: z.union([
      z.string(),
      z.object({
        url: z.string(),
        detail: z.enum(["auto", "low", "high"]).optional(),
      }),
    ]),
  }),
]);

const chatMessageContentSchema = z.union([
  z.string(),
  z.array(chatMessageContentPartSchema),
]);

const invalidToolCallSchema = z.object({
  name: z.string().optional(),
  args: z.string().optional(),
  id: z.string().optional(),
  error: z.string().optional(),
  type: z.literal("invalid_tool_call").optional(),
});

const usageMetadataSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
  total_tokens: z.number(),
  input_token_details: z
    .object({
      audio: z.number().optional(),
      cache_read: z.number().optional(),
      cache_creation: z.number().optional(),
    })
    .optional(),
  output_token_details: z
    .object({
      audio: z.number().optional(),
      reasoning: z.number().optional(),
    })
    .optional(),
});

const chatBaseMessageSchema = z.object({
  content: chatMessageContentSchema,
  additional_kwargs: z.record(z.string(), z.unknown()).optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  response_metadata: z.record(z.string(), z.unknown()).optional(),
});

export const chatMessageSchema = z.discriminatedUnion("type", [
  chatBaseMessageSchema.extend({
    type: z.literal("human"),
    example: z.boolean().optional(),
  }),
  chatBaseMessageSchema.extend({
    type: z.literal("ai"),
    example: z.boolean().optional(),
    tool_calls: z.array(chatToolCallSchema).optional(),
    invalid_tool_calls: z.array(invalidToolCallSchema).optional(),
    usage_metadata: usageMetadataSchema.optional(),
  }),
  chatBaseMessageSchema.extend({
    type: z.literal("tool"),
    status: z.enum(["success", "error"]).optional(),
    tool_call_id: z.string(),
  }),
  chatBaseMessageSchema.extend({
    type: z.literal("system"),
  }),
  chatBaseMessageSchema.extend({
    type: z.literal("function"),
  }),
  chatBaseMessageSchema.extend({
    type: z.literal("remove"),
  }),
]);

export type ChatMessageDTO = z.infer<typeof chatMessageSchema>;

export const chatHistoryResponseSchema = z.object({
  messages: z.array(chatMessageSchema),
});

export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;
