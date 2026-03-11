import { rateLimit, type Generator, type Options } from "elysia-rate-limit";
import { TooManyRequestsError } from "../errors";

const DEFAULT_RATE_LIMIT_DURATION_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 100;

const clientKeyGenerator: Generator = (request, server) => {
  const directIp = server?.requestIP(request)?.address;
  const realIp = request.headers.get("x-real-ip");
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return directIp ?? realIp ?? cloudflareIp ?? forwardedFor ?? "unknown";
};

function createScopedRateLimit(options: Partial<Options> = {}) {
  return rateLimit({
    scoping: "scoped",
    duration: DEFAULT_RATE_LIMIT_DURATION_MS,
    max: DEFAULT_RATE_LIMIT_MAX,
    generator: clientKeyGenerator,
    errorResponse: new TooManyRequestsError(
      "Rate limit exceeded. Please try again later.",
    ),
    ...options,
  });
}

export function createDefaultRateLimit() {
  return createScopedRateLimit();
}

const CHAT_RATE_LIMIT_DURATION_MS = 60_000;
const CHAT_RATE_LIMIT_MAX = 20;

export function createChatConversationRateLimit() {
  return createScopedRateLimit({
    duration: CHAT_RATE_LIMIT_DURATION_MS,
    max: CHAT_RATE_LIMIT_MAX,
  });
}
