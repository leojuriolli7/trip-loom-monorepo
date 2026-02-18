import type { Destination } from "./_components/destination-card";

/*
 * Everything here, including the types above, is completely subject to change.
 * The goal is just to have a demo UI to understand what the platform flow will eventually be.
 * There's no database schema ready and developed, and it will NOT follow the structure below
 * and types above.
 */

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
