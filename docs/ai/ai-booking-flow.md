# AI Booking and Payment Flow

How TripLoom's current LangGraph booking flow works.

## Architecture Overview

```
User <-> Chat UI <-> LangGraph Supervisor <-> Sub-agents (hotel, flight, destination, itinerary)
                                            |
                                      MCP Tools -> API -> Database
                                            |
                                      Local Tools (suggest_*)
```

For booking execution, the internal app wraps MCP booking tools with deterministic in-graph flow control:

- `create_hotel_booking` wrapper: book first, then interrupt for payment, then finish only after pay/cancel
- `create_flight_booking` wrapper: interrupt for seat selection, book, interrupt for payment, then finish only after pay/cancel

External MCP clients still call the raw MCP tools directly and handle user approval/payment in their own UX.

## Chat Rendering Layers

| Layer | Source | Purpose |
|-------|--------|---------|
| A — Tool Calls | `message.tool_calls` on AI messages | Preview search/suggestion activity and transfers |
| B — Tool Results | `tool` type messages | Persisted final booking outcomes after payment or cancellation |
| C — Live Interrupts | `stream.interrupts` | Active HITL widgets such as seat selection, payment, and approvals |

## Hotel Booking Flow

### Step-by-step

1. User asks for hotels.
2. Supervisor delegates to `hotel_agent`.
3. Hotel agent calls `search_hotels` and then `suggest_hotel_booking`.
4. User picks a hotel and room type.
5. Hotel agent calls `get_trip_details` to avoid duplicate bookings.
6. Hotel agent calls `create_hotel_booking`.
7. The internal booking wrapper calls the MCP/API booking endpoint immediately.
8. API creates or reuses the pending booking and payment session.
9. The wrapper fires a `request-booking-payment` interrupt.
10. Frontend renders the payment widget inline with the hotel booking summary.
11. If the user pays, the frontend polls payment status, resumes the graph with `{ status: "paid" }`, and the tool finishes.
12. If the user cancels, the frontend resumes the graph with `{ status: "cancelled" }`, and the tool finishes.
13. Persisted chat history stores the final booking outcome, not an intermediate payment-request tool result.

## Flight Booking Flow

### Step-by-step

1. User asks for flights.
2. Supervisor delegates to `flight_agent`.
3. Flight agent calls `search_flights` and then `suggest_flight`.
4. User picks a flight.
5. Flight agent calls `get_trip_details` to avoid duplicate bookings.
6. Flight agent calls `create_flight_booking` with the full selected flight payload from search results.
7. The internal booking wrapper fires a `request-seat-selection` interrupt before calling the backend booking endpoint.
8. Frontend renders the seat picker from the flight's seat map.
9. After seat selection, the wrapper calls the MCP/API booking endpoint with `offerToken`, `type`, and the chosen `seatNumber`.
10. API creates or reuses the pending booking and payment session.
11. The wrapper fires a `request-booking-payment` interrupt.
12. Frontend renders the payment widget inline with the flight booking summary.
13. If the user pays, the frontend polls payment status, resumes the graph with `{ status: "paid" }`, and the tool finishes.
14. If the user cancels payment, the graph resumes with `{ status: "cancelled" }`, and the tool finishes.

### Important properties

- Seat selection is part of the `create_flight_booking` flow, not a separate tool.
- The user must pick a seat before flight booking continues.
- The persisted tool result is the final paid/cancelled outcome card.

## Interrupt Types

| Type | Owner | Resume Shape | UI Component |
|------|-------|-------------|--------------|
| `request-seat-selection` | Internal `create_flight_booking` wrapper | `{ seatId }` | `SeatSelectionCard` |
| `request-booking-payment` | Internal hotel/flight booking wrappers | `{ status: "paid" | "cancelled" }` | `BookingPaymentInterruptCard` |
| `tool-approval` | Approval-wrapped tools such as cancellation and itinerary mutations | `{ approved: true }` or `{ approved: false, message? }` | `CancellationApprovalCard` / `ItineraryApprovalCard` |

## Duplicate Prevention

| Layer | Where | How |
|-------|-------|-----|
| 1. DB unique index | `hotel_booking_unique_active`, `flight_booking_unique_active` | Partial unique index where booking is not cancelled |
| 2. API idempotency | `createHotelBooking`, `createFlightBooking` services | Returns existing active booking instead of creating duplicates |
| 3. Agent prompts | Hotel and flight prompts | Require `get_trip_details` before booking |

## Tool Ownership

| Tool | Owner | Notes |
|------|-------|-------|
| `create_hotel_booking` | Hotel agent | Wrapped internally to include payment interrupt |
| `create_flight_booking` | Flight agent | Wrapped internally to include seat selection + payment interrupts |
| `cancel_hotel_booking` | Hotel agent | Approval handled by `withApproval()` |
| `cancel_flight_booking` | Flight agent | Approval handled by `withApproval()` |
| `search_hotels` / `search_flights` | Respective agents | Primary search tools |
| `suggest_*` | Respective agents | Presentation-only local tools |
| Itinerary mutations | Itinerary agent | Approval-wrapped |

## External MCP Clients

External clients do not use the internal wrappers.

They call the public MCP tools directly:

- `search_hotels`
- `create_hotel_booking`
- `search_flights`
- `create_flight_booking`

Those tools return booking data plus payment-session data. External clients remain responsible for:

- gathering user approval
- handling seat choice for flights
- opening hosted checkout or presenting their own payment UX

## Notes for Future Changes

- If multi-segment trips arrive later, booking ownership should likely move from trip-level to segment-level, but the interrupt-driven internal UX can remain the same.
