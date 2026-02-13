import type { SeatRow, FlightInfo } from "./types";

// Pre-generated deterministic mock data for consistent UI
export const MOCK_SEAT_ROWS: SeatRow[] = [
  {
    rowNumber: 1,
    sections: [
      [
        { id: "1A", price: 320, isBooked: true },
        { id: "1B", price: 320, isBooked: false },
      ],
      [
        { id: "1C", price: 320, isBooked: true },
        { id: "1D", price: 320, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 2,
    sections: [
      [
        { id: "2A", price: 290, isBooked: false },
        { id: "2B", price: 290, isBooked: true },
      ],
      [
        { id: "2C", price: 290, isBooked: false },
        { id: "2D", price: 290, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 3,
    sections: [
      [
        { id: "3A", price: 260, isBooked: true },
        { id: "3B", price: 260, isBooked: true },
      ],
      [
        { id: "3C", price: 260, isBooked: false },
        { id: "3D", price: 260, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 4,
    sections: [
      [
        { id: "4A", price: 230, isBooked: false },
        { id: "4B", price: 230, isBooked: false },
      ],
      [
        { id: "4C", price: 230, isBooked: true },
        { id: "4D", price: 230, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 5,
    sections: [
      [
        { id: "5A", price: 200, isBooked: true },
        { id: "5B", price: 200, isBooked: false },
      ],
      [
        { id: "5C", price: 200, isBooked: false },
        { id: "5D", price: 200, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 6,
    sections: [
      [
        { id: "6A", price: 180, isBooked: false },
        { id: "6B", price: 180, isBooked: true },
      ],
      [
        { id: "6C", price: 180, isBooked: true },
        { id: "6D", price: 180, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 7,
    sections: [
      [
        { id: "7A", price: 160, isBooked: false },
        { id: "7B", price: 160, isBooked: false },
      ],
      [
        { id: "7C", price: 160, isBooked: false },
        { id: "7D", price: 160, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 8,
    sections: [
      [
        { id: "8A", price: 150, isBooked: true },
        { id: "8B", price: 150, isBooked: false },
      ],
      [
        { id: "8C", price: 150, isBooked: false },
        { id: "8D", price: 150, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 9,
    sections: [
      [
        { id: "9A", price: 140, isBooked: false },
        { id: "9B", price: 140, isBooked: true },
      ],
      [
        { id: "9C", price: 140, isBooked: true },
        { id: "9D", price: 140, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 10,
    sections: [
      [
        { id: "10A", price: 130, isBooked: false },
        { id: "10B", price: 130, isBooked: false },
      ],
      [
        { id: "10C", price: 130, isBooked: false },
        { id: "10D", price: 130, isBooked: true },
      ],
    ],
  },
  {
    rowNumber: 11,
    sections: [
      [
        { id: "11A", price: 120, isBooked: true },
        { id: "11B", price: 120, isBooked: false },
      ],
      [
        { id: "11C", price: 120, isBooked: false },
        { id: "11D", price: 120, isBooked: false },
      ],
    ],
  },
  {
    rowNumber: 12,
    sections: [
      [
        { id: "12A", price: 110, isBooked: false },
        { id: "12B", price: 110, isBooked: true },
      ],
      [
        { id: "12C", price: 110, isBooked: false },
        { id: "12D", price: 110, isBooked: false },
      ],
    ],
  },
];

export const MOCK_FLIGHT_INFO: FlightInfo = {
  fromCode: "JFK",
  fromCity: "New York",
  departureTime: "08:30",
  toCode: "LAX",
  toCity: "Los Angeles",
  arrivalTime: "11:45",
  duration: "5h 15m",
};
