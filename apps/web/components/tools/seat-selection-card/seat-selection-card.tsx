"use client";

import { useMemo } from "react";
import type { FlightOptionDTO } from "@trip-loom/contracts/dto";
import { AirplaneSeatView } from "./airplane-seat-view/airplane-seat-view";

type SeatSelectionInterruptValue = {
  type: "request-seat-selection";
  flightOptionId: string;
  flightNumber: string;
  airline: string;
  departureAirportCode: string;
  departureCity: string;
  departureTime: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalTime: string;
  durationMinutes: number;
  cabinClass: FlightOptionDTO["cabinClass"];
  seatMap: FlightOptionDTO["seatMap"];
};

type SeatSelectionCardProps = {
  value: SeatSelectionInterruptValue;
  disabled?: boolean;
  onConfirm: (seatId: string) => void;
  onCancel: () => void;
};

export function SeatSelectionCard({
  value,
  disabled,
  onConfirm,
  onCancel,
}: SeatSelectionCardProps) {
  const flight = useMemo<FlightOptionDTO>(
    () => ({
      id: value.flightOptionId,
      priceInCents: 0,
      flightNumber: value.flightNumber,
      airline: value.airline,
      departureAirportCode: value.departureAirportCode,
      departureCity: value.departureCity,
      departureAirport: {
        code: value.departureAirportCode,
        name: value.departureAirportCode,
        city: value.departureCity,
        countryCode: "",
        timezone: "",
        latitude: null,
        longitude: null,
      },
      departureTime: value.departureTime,
      arrivalAirportCode: value.arrivalAirportCode,
      arrivalCity: value.arrivalCity,
      arrivalAirport: {
        code: value.arrivalAirportCode,
        name: value.arrivalAirportCode,
        city: value.arrivalCity,
        countryCode: "",
        timezone: "",
        latitude: null,
        longitude: null,
      },
      arrivalTime: value.arrivalTime,
      durationMinutes: value.durationMinutes,
      cabinClass: value.cabinClass,
      availableSeats: 0,
      seatMap: value.seatMap,
    }),
    [value],
  );

  return (
    <AirplaneSeatView
      title="Select Your Seat"
      flight={flight}
      onConfirm={(seatId) => {
        if (!disabled) {
          onConfirm(seatId);
        }
      }}
      onCancel={() => {
        if (!disabled) {
          onCancel();
        }
      }}
    />
  );
}
