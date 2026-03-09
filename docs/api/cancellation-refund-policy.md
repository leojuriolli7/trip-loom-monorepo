# Cancellation and Refund Policy

This document describes current backend behavior across trip, booking, and payment domains.

## Scope

- Trip cancellation (`trip.status = "cancelled"`)
- Booking cancellation (`booking.status = "cancelled"`)
- Payment refunds (`payment.status = "refunded"` or `payment.status = "partially_refunded"`)

## Status Models

- Trip status: `draft | upcoming | current | past | cancelled`
- Booking status (flight/hotel): `pending | confirmed | cancelled`
- Payment status: `pending | processing | succeeded | failed | refunded | partially_refunded`

## Endpoint Policy

### Booking cancellation endpoints

- `DELETE /api/trips/:id/flights/:flightId`
- `DELETE /api/trips/:id/hotels/:hotelBookingId`

Current behavior:

1. Sets booking status to `cancelled`.
2. Calls trip status refresh logic.
3. Does not automatically create a refund.
4. Does not modify payment status.

Implication: cancellation and refund are separate operations. If refund is required, call refund endpoint explicitly.

### Payment refund endpoint

- `POST /api/payments/:id/refund`

Current behavior:

1. Allowed only when payment is `succeeded` or `partially_refunded`.
2. Refund amount defaults to full remaining amount.
3. Full refund:
   - payment -> `refunded`
   - linked bookings -> `cancelled`
4. Partial refund:
   - payment -> `partially_refunded`
   - linked bookings remain as-is (typically `confirmed`)

### Stripe webhook policy (authoritative)

- `POST /api/webhooks/stripe`

Current behavior:

1. Deduplicates events by Stripe event ID (`stripe_webhook_event` table).
2. `payment_intent.succeeded`:
   - payment -> terminal success state
   - booking linked by metadata (`bookingType`, `bookingId`, `tripId`)
   - booking -> `confirmed`
3. `payment_intent.payment_failed`:
   - payment -> `failed` (if not already terminal)
4. `charge.refunded`:
   - updates refunded amount and payment refund status
   - cancels linked bookings only when refund is full

## Trip Status Side Effects

Trip status refresh uses travel-plan existence:

- Non-cancelled flight bookings
- Non-cancelled hotel bookings
- Itinerary existence

Important effects:

1. Cancelling the last active booking can move trip back to `draft` if there is no itinerary and trip is not `cancelled`.
2. Payment refunds that fully cancel linked bookings can also move trip back to `draft` (same condition).
3. If trip is already `cancelled`, automatic refresh keeps it `cancelled` (sticky) until explicit trip status update.

## Policy Matrix

| Action | Booking Status Result | Payment Status Result | Trip Status Refresh |
|---|---|---|---|
| Delete flight/hotel booking | `cancelled` | unchanged | Yes |
| Partial refund | unchanged | `partially_refunded` | No direct refresh (booking unchanged) |
| Full refund | linked booking(s) `cancelled` | `refunded` | No direct trip refresh call in payment service; trip status reflects booking state on next refresh-triggering mutation |
| Webhook payment success | linked booking `confirmed` | `succeeded` (or refund-derived terminal) | No direct trip refresh call |
| Webhook payment failure | unchanged | `failed` | No direct trip refresh call |

## Current Known Gap

Payment webhook/refund flows update booking states but do not call `refreshTripStatus` directly in the payment service.

Result:

- Trip status can become temporarily stale after webhook/refund state transitions.
- It will self-correct on next mutation that triggers refresh, or when trip status is explicitly patched.

If strict immediate consistency is required, add trip refresh calls in payment webhook/refund transaction paths.
