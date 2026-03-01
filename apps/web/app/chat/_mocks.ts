import type { FlightOptionDTO } from "@trip-loom/api/dto";
import { MOCK_SEAT_MAP } from "@/components/tools-ui/airplane-seat-view/_mocks";

// Mock data for sidebar
export const drafts = [
  {
    id: "draft-1",
    title: "Planning summer vacation...",
    updatedAt: "2 hrs ago",
  },
  { id: "draft-2", title: "Where to go in December?", updatedAt: "Yesterday" },
];

export const currentTrips = [
  {
    id: "current-1",
    destination: "Tokyo",
    country: "Japan",
    dates: "Apr 10-20, 2026",
  },
];

export const upcomingTrips = [
  {
    id: "upcoming-1",
    destination: "Barcelona",
    country: "Spain",
    dates: "Jun 15-22, 2026",
  },
  {
    id: "upcoming-2",
    destination: "Santorini",
    country: "Greece",
    dates: "Aug 1-8, 2026",
  },
];

export const pastTrips = [
  {
    id: "past-1",
    destination: "Paris",
    country: "France",
    dates: "Dec 20-28, 2025",
  },
  {
    id: "past-2",
    destination: "Bali",
    country: "Indonesia",
    dates: "Jul 10-20, 2025",
  },
];

// Mock conversation messages
export type MessageWidget = {
  type: "seat-picker";
  data: {
    flight: FlightOptionDTO;
  };
};

export type MockMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  widget?: MessageWidget;
};

export const mockMessages: MockMessage[] = [
  {
    id: "msg-1",
    from: "user",
    content:
      "Find me a place to go on vacation in July. I like warm beaches and good food!",
  },
  {
    id: "msg-2",
    from: "assistant",
    content: `Great choice! July is perfect for a beach vacation. Based on your preferences for warm beaches and great food, here are my top recommendations:

**1. Santorini, Greece** 🇬🇷
Stunning caldera views, black sand beaches, and incredible Mediterranean cuisine. The sunsets are legendary!

**2. Bali, Indonesia** 🇮🇩
Beautiful beaches, vibrant culture, and some of the best food in Southeast Asia. From local warungs to fine dining.

**3. Amalfi Coast, Italy** 🇮🇹
Dramatic coastline, crystal-clear waters, and world-renowned Italian cuisine. Limoncello on a seaside terrace!

Would you like me to dive deeper into any of these destinations? I can help you:
- Research specific activities and attractions
- Find flights and accommodations
- Create a personalized itinerary

Just let me know which destination catches your eye! ✨`,
  },
  {
    id: "msg-3",
    from: "user",
    content:
      "Santorini sounds amazing! I want to go July 15-22. Can you book me flights from New York?",
  },
  {
    id: "msg-4",
    from: "assistant",
    content: `I found a great flight option for your Santorini trip! Here's what I recommend:

**Delta DL1842** - Direct flight from JFK to Santorini (JTR)

I've pre-selected seat 3C for you - it's a window seat with extra legroom. You can change the seat selection below if you'd like a different one.`,
    widget: {
      type: "seat-picker",
      data: {
        flight: {
          id: "chat-flight-1",
          flightNumber: "DL1842",
          airline: "Delta Airlines",
          departureAirportCode: "JFK",
          departureCity: "New York",
          departureAirport: {
            code: "JFK",
            name: "John F. Kennedy International Airport",
            city: "New York",
            countryCode: "US",
            timezone: "America/New_York",
            latitude: 40.6413,
            longitude: -73.7781,
          },
          departureTime: "2026-07-15T18:30:00.000Z",
          arrivalAirportCode: "JTR",
          arrivalCity: "Santorini",
          arrivalAirport: {
            code: "JTR",
            name: "Santorini International Airport",
            city: "Santorini",
            countryCode: "GR",
            timezone: "Europe/Athens",
            latitude: 36.3992,
            longitude: 25.4793,
          },
          arrivalTime: "2026-07-16T04:45:00.000Z",
          durationMinutes: 615,
          cabinClass: "business",
          availableSeats: 48,
          seatMap: MOCK_SEAT_MAP,
        },
      },
    },
  },
];
