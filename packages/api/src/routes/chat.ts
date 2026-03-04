import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "../dto/common";
import {
  chatInputSchema,
  chatHistoryResponseSchema,
  type ChatInput,
} from "../dto/chat";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
import { BadRequestError } from "../errors";
import {
  streamChatResponse,
  resumeChatResponse,
  getChatHistory,
} from "../services/chat";

const tripIdParamSchema = z.object({
  id: z.string().min(1),
});

function extractMessageFromInput(input: unknown): string | undefined {
  if (typeof input === "string" && input.trim()) {
    return input.trim();
  }

  if (!input || typeof input !== "object") {
    return undefined;
  }

  const messages = Reflect.get(input, "messages");
  if (!Array.isArray(messages)) {
    return undefined;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message !== "object") {
      continue;
    }

    const type = Reflect.get(message, "type");
    const content = Reflect.get(message, "content");

    if (
      (type === "human" || type === "user") &&
      typeof content === "string" &&
      content.trim()
    ) {
      return content.trim();
    }
  }

  return undefined;
}

function normalizeChatInput(body: ChatInput): {
  message?: string;
  resumeData?: unknown;
} {
  return {
    message: extractMessageFromInput(body.input),
    resumeData: body.command?.resume,
  };
}

const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export const chatRoutes = new Elysia({
  name: "chat",
  prefix: "/api/trips",
})
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .post(
    "/:id/chat",
    async ({ user, params, body, wideEvent }) => {
      wideEvent.trip_id = params.id;
      const normalized = normalizeChatInput(body);

      const { stream, threadId } =
        normalized.resumeData !== undefined
          ? await resumeChatResponse(
              user.id,
              params.id,
              normalized.resumeData,
            )
          : await (async () => {
              if (!normalized.message) {
                throw new BadRequestError(
                  "Either input or command.resume is required",
                );
              }

              return streamChatResponse(
                user.id,
                params.id,
                normalized.message,
              );
            })();

      wideEvent.thread_id = threadId;

      return new Response(stream, { headers: sseHeaders });
    },
    {
      auth: true,
      params: tripIdParamSchema,
      body: chatInputSchema,
    },
  )
  .get(
    "/:id/chat/history",
    async ({ user, params }) => {
      return getChatHistory(user.id, params.id);
    },
    {
      auth: true,
      params: tripIdParamSchema,
      response: {
        200: chatHistoryResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
