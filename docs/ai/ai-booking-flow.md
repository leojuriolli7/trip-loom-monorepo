# AI Booking and Payment Flow

How the LangGraph agent system handles bookings and payments with human-in-the-loop (HITL) controls.

## Architecture Overview

```
User <-> Chat UI <-> LangGraph Supervisor <-> Sub-agents (hotel, flight, destination, itinerary)
                                            |
                                      MCP Tools -> API -> Database
                                            |
                                      Local Tools (suggest_*, request_payment, request_seat_selection)
```

**Three rendering layers in the chat UI:**

| Layer | Source | Purpose |
|-------|--------|---------|
| A — Tool Calls | `message.tool_calls` on AI messages | Previews of tool activity (search cards, suggestion cards, transfers) |
| B — Tool Results | `tool` type messages | Persisted outcomes (payment result, booking confirmation) |
| C — Live Interrupts | `stream.interrupts` | Active HITL widgets (payment checkout, tool approval, seat selection) |

## Hotel Booking Flow

### Step-by-step

1. **User asks for hotels** -> Supervisor delegates to `hotel_agent`
2. **Hotel agent searches** -> `search_hotels` (MCP) -> returns hotel data
3. **Hotel agent suggests** -> `suggest_hotel_booking` (local) -> frontend renders hotel cards (Layer A)
4. **User picks a hotel** -> types choice in chat
5. **Hotel agent checks for current bookings** -> `get_trip_details` (MCP) -> inspects `hotelBookings` array
6. **Hotel agent books** -> `create_hotel_booking` (MCP) -> booking created as `pending` (no UI card for this)
7. **Hotel agent returns to supervisor** -> `transfer_back_to_supervisor`
8. **Supervisor triggers payment** -> `request_payment` (local) -> `interrupt()` pauses the graph
9. **Frontend renders payment widget** (Layer C) -> `PaymentRequestCard` with `HotelBookingSummaryCard`
10. **User pays via Stripe** -> frontend polls until `succeeded` -> `submitResume()` with payment result
11. **Graph resumes** -> `request_payment` tool returns result with anti-re-delegation instructions
12. **Supervisor confirms to user** -> booking flow is FINISHED

### What the JSON chat history shows

```
[1]  HUMAN: "I want to go to a nice beach in south america..."
[2]  SUPERVISOR: get_user_preferences
[4]  SUPERVISOR: transfer_to_destination_agent
[6]  DESTINATION: search_destinations (multiple attempts with different queries)
[14] DESTINATION: suggest_destinations -> 5 options rendered
[20] HUMAN: "Arraial d'Ajuda, April 17-26"
[21] SUPERVISOR: update_trip (sets destination + dates)
[23] SUPERVISOR: transfer_to_hotel_agent
[25] HOTEL: search_hotels
[27] HOTEL: suggest_hotel_booking -> 5 hotel cards rendered
[31] HUMAN: "Ravenala Hotel, 1 room, standard"
[32] SUPERVISOR: transfer_to_hotel_agent
[34] HOTEL: get_trip_details (duplicate check — no existing bookings)
[36] HOTEL: create_hotel_booking -> pending booking created
[39] HOTEL: transfer_back_to_supervisor
[41] SUPERVISOR: request_payment -> interrupt() fired
     ... user pays via Stripe widget ...
[42] TOOL: request_payment result (paid) + "FINISHED" instruction
[43] SUPERVISOR: confirms payment, offers next steps
```

### Key observations

- **Duplicate prevention** — hotel agent calls `get_trip_details` before booking to check existing bookings.
- **Anti-re-delegation** — `request_payment` result includes "Do NOT delegate to any sub-agent" text.
- **Supervisor owns payment** — only the supervisor calls `request_payment`, never sub-agents.

## Cancellation Flow

1. User asks to cancel a booking
2. Supervisor delegates to the appropriate sub-agent (hotel or flight)
3. Sub-agent calls the cancellation MCP tool (`cancel_hotel_booking` or `cancel_flight_booking`)
4. The [tool approval wrapper](./tool-approval.md) fires `interrupt()` -> graph pauses
5. Frontend renders `CancellationApprovalCard` (Layer C) with booking summary
6. User confirms or rejects -> `submitResume()` with `{ approved: true }` or `{ approved: false, message? }`
7. If approved: the original MCP tool executes and the booking is cancelled
8. If rejected: agent receives feedback and acknowledges

## Duplicate Prevention (5 Layers)

| Layer | Where | How |
|-------|-------|-----|
| 1. DB unique index | `hotel_booking_unique_active`, `flight_booking_unique_active` | Partial unique index WHERE status != 'cancelled' |
| 2. API idempotency | `createHotelBooking`, `createFlightBooking` services | Returns existing booking (HTTP 200) instead of creating duplicate |
| 3. MCP tool messaging | `create-hotel-booking.ts`, `book-flight.ts` MCP tools | Detects HTTP 200 -> prepends "existing booking" warning |
| 4. Agent prompts | Hotel and flight agent system prompts | "Check get_trip_details before booking" |
| 5. Post-resume guard | `request_payment` tool result text | "Do NOT delegate to any sub-agent for this booking" |

## Tool Ownership Rules

| Tool | Owner | Why |
|------|-------|-----|
| `request_payment` | Supervisor only | Payment is a cross-cutting concern; sub-agents just book |
| `cancel_hotel_booking` | Hotel agent | Domain-specific; approval handled automatically by wrapper |
| `cancel_flight_booking` | Flight agent | Domain-specific; approval handled automatically by wrapper |
| `create_hotel_booking` | Hotel agent | Domain-specific booking logic |
| `book_flight` | Flight agent | Domain-specific booking logic |
| `get_trip_details` | Hotel + Flight agents | Needed for duplicate checks before booking |
| `request_seat_selection` | Flight agent | Seat selection is part of flight booking domain |
| `suggest_*` | Respective sub-agents | Presentation tools that render UI cards |
| Itinerary mutations | Itinerary agent | All 5 mutations wrapped with approval |

## Flight Booking Flow

### Step-by-step

1. **User asks for flights** -> Supervisor delegates to `flight_agent`
2. **Flight agent searches** -> `search_flights` (MCP) -> returns `FlightOptionDTO[]` with seat maps
3. **Flight agent suggests** -> `suggest_flight` (local) -> frontend renders flight comparison cards (Layer A)
4. **User picks a flight** -> types choice in chat
5. **Flight agent shows seat picker** -> `request_seat_selection` (local) -> `interrupt()` pauses graph with full flight data + `seatMap`
6. **Frontend renders `AirplaneSeatView`** (Layer C) -> user picks a seat or skips
7. **Graph resumes** with `{ seatId, seatPriceInCents }` (or `{ seatId: null, seatPriceInCents: 0 }` if skipped)
8. **Flight agent checks for current bookings** -> `get_trip_details` (MCP) -> inspects `flightBookings` array
9. **Flight agent books** -> `book_flight` (MCP) -> booking created as `pending` with seat number
10. **Flight agent returns to supervisor** -> `transfer_back_to_supervisor`
11. **Supervisor triggers payment** -> `request_payment` (local) -> `interrupt()` pauses the graph
12. **Frontend renders payment widget** (Layer C) -> `PaymentRequestCard` with `FlightBookingSummaryCard`
13. **User pays via Stripe** -> frontend polls until `succeeded` -> `submitResume()` with payment result
14. **Graph resumes** -> `request_payment` tool returns result with anti-re-delegation instructions
15. **Supervisor confirms to user** -> booking flow is FINISHED

### Key observations

- **Seat selection before booking** — the flight agent uses `request_seat_selection` to show the interactive seat picker before calling `book_flight`, so the seat number is included in the booking from the start.
- **Seat selection is optional** — users can skip seat selection; the booking proceeds with `seatNumber: null`.
- **Flight agent owns seat selection** — `request_seat_selection` is a flight-agent local tool, since seat selection is part of the flight booking domain.
- **Supervisor owns payment** — same as hotels, only the supervisor calls `request_payment`.

## Interrupt Types

| Type | Tool | Resume Shape | UI Component |
|------|------|-------------|--------------|
| `request-payment` | `request_payment` | `{ status, bookingId, bookingType, paymentId? }` | `PaymentRequestCard` |
| `tool-approval` | Any tool in `APPROVAL_REQUIRED_TOOLS` | `{ approved: true }` or `{ approved: false, message? }` | `ItineraryApprovalCard` / `CancellationApprovalCard` |
| `request-seat-selection` | `request_seat_selection` | `{ seatId, seatPriceInCents }` | `SeatSelectionCard` -> `AirplaneSeatView` |

See [Tool Approval](./tool-approval.md) for details on the approval pattern.

## Future: Multi-Destination Trips

The current system enforces **one active hotel booking per hotel per trip** and **one active flight booking per flight per trip**. To support multi-leg trips (e.g., Paris -> Zurich -> Rome):

### Database Changes

1. **Remove or relax unique indexes** — the partial unique index on `(trip_id, hotel_id)` prevents booking the same hotel twice but allows different hotels. For multi-city, the current indexes already allow multiple different hotels/flights per trip. The constraint would only block rebooking the exact same hotel or flight, which is correct.

2. **Add a `leg` or `segment` concept** — new `trip_segment` table:
   ```
   trip_segment: id, tripId, destinationId, startDate, endDate, orderIndex
   ```
   Hotel and flight bookings would reference a segment instead of (or in addition to) the trip directly.

3. **Update booking tables** — add optional `segmentId` FK to `hotel_booking` and `flight_booking`. The unique indexes would then be scoped to `(segment_id, hotel_id)` instead of `(trip_id, hotel_id)`.

### Agent Changes

1. **Supervisor prompt** — teach it about multi-leg trip planning (sequential city routing)
2. **Sub-agent prompts** — update duplicate-check logic to be segment-aware
3. **MCP tools** — `create_hotel_booking` and `book_flight` would accept optional `segmentId`
4. **`get_trip_details`** — response would include segments with their bookings grouped

### Frontend Changes

1. **Trip timeline UI** — visual segment representation (city -> city)
2. **Payment** — could batch-pay all bookings in a segment, or pay individually (current approach still works)

### What Already Works

- Multiple different hotels per trip (different `hotelId`) — allowed by current indexes
- Multiple different flights per trip (different flight numbers) — allowed
- The `request_payment` flow is per-booking, so it naturally supports N bookings
- `usePaymentBooking` hook already handles both flight and hotel types
