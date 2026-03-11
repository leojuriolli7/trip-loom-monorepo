import { createHmac, timingSafeEqual } from "node:crypto";
import type { FlightOptionDTO } from "@trip-loom/contracts/dto/flights";
import { BadRequestError } from "../../errors";

type FlightOfferPayload = Pick<
  FlightOptionDTO,
  | "priceInCents"
  | "flightNumber"
  | "airline"
  | "departureAirportCode"
  | "departureCity"
  | "departureTime"
  | "arrivalAirportCode"
  | "arrivalCity"
  | "arrivalTime"
  | "durationMinutes"
  | "cabinClass"
> & {
  expiresAt: string;
};

const TOKEN_VERSION = "v1";

function getOfferTokenSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for flight offer tokens");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getOfferTokenSecret())
    .update(`${TOKEN_VERSION}.${encodedPayload}`)
    .digest("base64url");
}

export function createFlightOfferToken(payload: FlightOfferPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${TOKEN_VERSION}.${encodedPayload}.${signature}`;
}

export function verifyFlightOfferToken(token: string): FlightOfferPayload {
  const [version, encodedPayload, signature] = token.split(".");

  if (!version || !encodedPayload || !signature || version !== TOKEN_VERSION) {
    throw new BadRequestError("Invalid flight offer token");
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new BadRequestError("Invalid flight offer token signature");
  }

  let payload: FlightOfferPayload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload)) as FlightOfferPayload;
  } catch {
    throw new BadRequestError("Invalid flight offer token payload");
  }

  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new BadRequestError("Flight offer token has expired");
  }

  return payload;
}
