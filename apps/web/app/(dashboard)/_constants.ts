import type { Trip } from "./_components/trip-card";
import type { Destination } from "./_components/destination-card";

/*
 * Everything here, including the types above, are completely subject to change.
 * The goal is just to have a demo UI to understand what the platform flow will eventually be.
 * There's no database schema ready and developed, and it will NOT follow the structure below
 * and types above.
 */

export const mockUser = {
  name: "Leonardo",
};

export const upcomingTrips: Trip[] = [
  {
    id: "1",
    destination: "Tokyo",
    country: "Japan",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
    startDate: "2026-04-10",
    endDate: "2026-04-20",
    status: "upcoming",
    hasFlights: true,
    hasHotel: true,
    hasItinerary: true,
  },
  {
    id: "2",
    destination: "Barcelona",
    country: "Spain",
    imageUrl:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop",
    startDate: "2026-06-15",
    endDate: "2026-06-22",
    status: "upcoming",
    hasFlights: true,
    hasHotel: true,
    hasItinerary: false,
  },
  {
    id: "3",
    destination: "Santorini",
    country: "Greece",
    imageUrl:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop",
    startDate: "2026-08-01",
    endDate: "2026-08-08",
    status: "upcoming",
    hasFlights: false,
    hasHotel: true,
    hasItinerary: false,
  },
];

export const pastTrips: Trip[] = [
  {
    id: "4",
    destination: "Paris",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
    startDate: "2025-12-20",
    endDate: "2025-12-28",
    status: "past",
    hasFlights: true,
    hasHotel: true,
    hasItinerary: true,
  },
  {
    id: "5",
    destination: "New York",
    country: "United States",
    imageUrl:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
    startDate: "2025-09-05",
    endDate: "2025-09-12",
    status: "past",
    hasFlights: true,
    hasHotel: true,
    hasItinerary: true,
  },
  {
    id: "6",
    destination: "Bali",
    country: "Indonesia",
    imageUrl:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop",
    startDate: "2025-07-10",
    endDate: "2025-07-20",
    status: "past",
    hasFlights: true,
    hasHotel: true,
    hasItinerary: true,
  },
  {
    id: "7",
    destination: "Rome",
    country: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
    startDate: "2025-05-01",
    endDate: "2025-05-07",
    status: "past",
    hasFlights: true,
    hasHotel: true,
    hasItinerary: false,
  },
];

export const suggestedDestinations: Destination[] = [
  {
    id: "d1",
    name: "Kyoto",
    country: "Japan",
    imageUrl:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=1000&fit=crop",
    description:
      "Ancient temples, traditional gardens, and authentic Japanese culture.",
    matchReason: "Based on your Tokyo trip",
  },
  {
    id: "d2",
    name: "Lisbon",
    country: "Portugal",
    imageUrl:
      "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=1000&fit=crop",
    description:
      "Colorful streets, historic trams, and delicious pastéis de nata.",
    matchReason: "You love European cities",
  },
  {
    id: "d3",
    name: "Maldives",
    country: "Maldives",
    imageUrl:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=1000&fit=crop",
    description:
      "Crystal clear waters, overwater bungalows, and pure paradise.",
    matchReason: "Perfect for relaxation",
  },
  {
    id: "d4",
    name: "Marrakech",
    country: "Morocco",
    imageUrl:
      "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&h=1000&fit=crop",
    description: "Vibrant souks, stunning riads, and rich Moroccan heritage.",
  },
  {
    id: "d5",
    name: "Reykjavik",
    country: "Iceland",
    imageUrl:
      "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&h=1000&fit=crop",
    description:
      "Northern lights, geothermal springs, and dramatic landscapes.",
  },
];
