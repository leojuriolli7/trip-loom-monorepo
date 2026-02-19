import { tripStatusEnum } from "../../db/schema";
import { isValidDateRange } from "../date-range";
import { BadRequestError } from "../../errors";
import { TripStatus } from "../../enums";

type TripDerivedStatus = "upcoming" | "current" | "past";
const derivedTripStatuses = new Set<TripStatus>([
  "upcoming",
  "current",
  "past",
]);

const deriveTripStatusFromDates = (
  startDate: string,
  endDate: string,
): TripDerivedStatus => {
  const today = new Date().toISOString().slice(0, 10);

  if (endDate < today) {
    return "past";
  }

  if (startDate > today) {
    return "upcoming";
  }

  return "current";
};

export const resolveTripStatus = ({
  currentStatus,
  requestedStatus,
  startDate,
  endDate,
  hasTravelPlan,
}: {
  currentStatus: TripStatus;
  requestedStatus: TripStatus | undefined;
  startDate: string | null;
  endDate: string | null;
  hasTravelPlan: boolean;
}): TripStatus => {
  if (!isValidDateRange(startDate, endDate)) {
    throw new BadRequestError("startDate must be before or equal to endDate");
  }

  if (requestedStatus) {
    if (requestedStatus === "cancelled") {
      return requestedStatus;
    }

    if (requestedStatus === "draft") {
      if (hasTravelPlan) {
        throw new BadRequestError(
          "Trips with bookings or itinerary cannot be set back to draft",
        );
      }
      return requestedStatus;
    }

    if (!startDate || !endDate) {
      throw new BadRequestError(
        "upcoming/current/past trips require both startDate and endDate",
      );
    }

    if (!hasTravelPlan) {
      throw new BadRequestError(
        "upcoming/current/past trips require at least one booking or itinerary",
      );
    }

    const derivedStatus = deriveTripStatusFromDates(startDate, endDate);
    if (requestedStatus !== derivedStatus) {
      throw new BadRequestError(
        `Status must match dates. Expected '${derivedStatus}' for the provided dates`,
      );
    }

    return requestedStatus;
  }

  if (currentStatus === "cancelled") {
    return currentStatus;
  }

  if (derivedTripStatuses.has(currentStatus) && (!startDate || !endDate)) {
    throw new BadRequestError(
      "upcoming/current/past trips require both startDate and endDate",
    );
  }

  if (!startDate || !endDate || !hasTravelPlan) {
    return hasTravelPlan ? currentStatus : "draft";
  }

  return deriveTripStatusFromDates(startDate, endDate);
};
