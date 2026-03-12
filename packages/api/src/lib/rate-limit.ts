import { rateLimit, type Generator, type Options } from "elysia-rate-limit";
import { ServiceUnavailableError, TooManyRequestsError } from "../errors";

const DEFAULT_RATE_LIMIT_DURATION_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 100;

const clientKeyGenerator: Generator = (request, server) => {
  const directIp = server?.requestIP(request)?.address;

  // To avoid attackers bypassing ratelimits with fake IPs, we comment this out for now
  // const realIp = request.headers.get("x-real-ip");
  // const cloudflareIp = request.headers.get("cf-connecting-ip");
  // const forwardedFor = request.headers
  //   .get("x-forwarded-for")
  //   ?.split(",")[0]
  //   ?.trim();

  if (!directIp) {
    console.error("Rate limit rejected request without direct client IP", {
      method: request.method,
      url: request.url,
    });

    throw new ServiceUnavailableError(
      "Unable to determine client IP for rate limiting.",
    );
  }

  return directIp;
};

function createScopedRateLimit(options: Partial<Options> = {}) {
  return rateLimit({
    scoping: "scoped",
    duration: DEFAULT_RATE_LIMIT_DURATION_MS,
    max: DEFAULT_RATE_LIMIT_MAX,
    countFailedRequest: true, // Bad actors could span fail requests
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
