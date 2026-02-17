import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTripStatus } from "./rules";

describe("Trip status rules", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requested non-draft statuses require both startDate and endDate", () => {
    expect(() =>
      resolveTripStatus({
        currentStatus: "draft",
        requestedStatus: "upcoming",
        startDate: null,
        endDate: "2026-02-10",
        hasTravelPlan: true,
      }),
    ).toThrowError("upcoming/current/past trips require both startDate and endDate");
  });

  it("requested non-draft statuses require a travel plan", () => {
    expect(() =>
      resolveTripStatus({
        currentStatus: "draft",
        requestedStatus: "upcoming",
        startDate: "2026-02-01",
        endDate: "2026-02-10",
        hasTravelPlan: false,
      }),
    ).toThrowError(
      "upcoming/current/past trips require at least one booking or itinerary",
    );
  });

  it("requested status must match the date-derived status", () => {
    expect(() =>
      resolveTripStatus({
        currentStatus: "upcoming",
        requestedStatus: "past",
        startDate: "2026-02-01",
        endDate: "2026-02-10",
        hasTravelPlan: true,
      }),
    ).toThrowError("Status must match dates. Expected 'upcoming' for the provided dates");
  });

  it("draft is rejected when trip has a travel plan", () => {
    expect(() =>
      resolveTripStatus({
        currentStatus: "upcoming",
        requestedStatus: "draft",
        startDate: "2026-02-01",
        endDate: "2026-02-10",
        hasTravelPlan: true,
      }),
    ).toThrowError("Trips with bookings or itinerary cannot be set back to draft");
  });

  it("cancelled remains stable without an explicit requested status", () => {
    const result = resolveTripStatus({
      currentStatus: "cancelled",
      requestedStatus: undefined,
      startDate: null,
      endDate: null,
      hasTravelPlan: false,
    });

    expect(result).toBe("cancelled");
  });

  it("invalid date ranges are rejected", () => {
    expect(() =>
      resolveTripStatus({
        currentStatus: "draft",
        requestedStatus: undefined,
        startDate: "2026-03-20",
        endDate: "2026-03-01",
        hasTravelPlan: false,
      }),
    ).toThrowError("startDate must be before or equal to endDate");
  });

  it("derived statuses cannot remain without both start and end dates", () => {
    expect(() =>
      resolveTripStatus({
        currentStatus: "upcoming",
        requestedStatus: undefined,
        startDate: null,
        endDate: "2026-03-01",
        hasTravelPlan: true,
      }),
    ).toThrowError("upcoming/current/past trips require both startDate and endDate");
  });
});
