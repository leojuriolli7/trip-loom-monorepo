import type { FlightSeatMap } from "@trip-loom/api/dto";

// Pre-generated deterministic mock data for consistent UI
export const MOCK_SEAT_MAP: FlightSeatMap = [
  {
    rowNumber: 1,
    sections: [
      [
        { id: "1A", priceInCents: 320, isBooked: true },
        { id: "1B", priceInCents: 320, isBooked: false },
      ],
      [
        { id: "1C", priceInCents: 320, isBooked: true },
        { id: "1D", priceInCents: 320, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 2,
    sections: [
      [
        { id: "2A", priceInCents: 290, isBooked: false },
        { id: "2B", priceInCents: 290, isBooked: true },
      ],
      [
        { id: "2C", priceInCents: 290, isBooked: false },
        { id: "2D", priceInCents: 290, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 3,
    sections: [
      [
        { id: "3A", priceInCents: 260, isBooked: true },
        { id: "3B", priceInCents: 260, isBooked: true },
      ],
      [
        { id: "3C", priceInCents: 260, isBooked: false },
        { id: "3D", priceInCents: 260, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 4,
    sections: [
      [
        { id: "4A", priceInCents: 230, isBooked: false },
        { id: "4B", priceInCents: 230, isBooked: false },
      ],
      [
        { id: "4C", priceInCents: 230, isBooked: true },
        { id: "4D", priceInCents: 230, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 5,
    sections: [
      [
        { id: "5A", priceInCents: 200, isBooked: true },
        { id: "5B", priceInCents: 200, isBooked: false },
      ],
      [
        { id: "5C", priceInCents: 200, isBooked: false },
        { id: "5D", priceInCents: 200, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 6,
    sections: [
      [
        { id: "6A", priceInCents: 180, isBooked: false },
        { id: "6B", priceInCents: 180, isBooked: true },
      ],
      [
        { id: "6C", priceInCents: 180, isBooked: true },
        { id: "6D", priceInCents: 180, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 7,
    sections: [
      [
        { id: "7A", priceInCents: 160, isBooked: false },
        { id: "7B", priceInCents: 160, isBooked: false },
      ],
      [
        { id: "7C", priceInCents: 160, isBooked: false },
        { id: "7D", priceInCents: 160, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 8,
    sections: [
      [
        { id: "8A", priceInCents: 150, isBooked: true },
        { id: "8B", priceInCents: 150, isBooked: false },
      ],
      [
        { id: "8C", priceInCents: 150, isBooked: false },
        { id: "8D", priceInCents: 150, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 9,
    sections: [
      [
        { id: "9A", priceInCents: 140, isBooked: false },
        { id: "9B", priceInCents: 140, isBooked: true },
      ],
      [
        { id: "9C", priceInCents: 140, isBooked: true },
        { id: "9D", priceInCents: 140, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 10,
    sections: [
      [
        { id: "10A", priceInCents: 130, isBooked: false },
        { id: "10B", priceInCents: 130, isBooked: false },
      ],
      [
        { id: "10C", priceInCents: 130, isBooked: false },
        { id: "10D", priceInCents: 130, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 11,
    sections: [
      [
        { id: "11A", priceInCents: 120, isBooked: true },
        { id: "11B", priceInCents: 120, isBooked: false },
      ],
      [
        { id: "11C", priceInCents: 120, isBooked: false },
        { id: "11D", priceInCents: 120, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 12,
    sections: [
      [
        { id: "12A", priceInCents: 110, isBooked: false },
        { id: "12B", priceInCents: 110, isBooked: true },
      ],
      [
        { id: "12C", priceInCents: 110, isBooked: false },
        { id: "12D", priceInCents: 110, isBooked: false },
      ],
    ],
  },
];

export const MOCK_FLIGHT_INFO = {
  fromCode: "JFK",
  fromCity: "New York",
  departureTime: "08:30",
  toCode: "LAX",
  toCity: "Los Angeles",
  arrivalTime: "11:45",
  duration: "5h 15m",
} as const;
