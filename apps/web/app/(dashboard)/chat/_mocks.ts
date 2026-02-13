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
export const mockMessages = [
  {
    id: "msg-1",
    from: "user" as const,
    content:
      "Find me a place to go on vacation in July. I like warm beaches and good food!",
  },
  {
    id: "msg-2",
    from: "assistant" as const,
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
];
