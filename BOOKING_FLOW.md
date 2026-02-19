# Booking Flow with SQS Event Integration

## Overview

This document describes the enhanced booking flow that includes SQS (Simple Queue Service) event publishing for asynchronous communication between the booking service and provider service.

## Architecture

### Booking Lifecycle

```
1. User Creates Booking
   ↓
2. Booking Status: "pending"
   ↓
3. BOOKING_CREATED Event → SQS (Request Queue)
   ↓
4. Provider Service Consumes Event
   ↓
5. Provider Accepts/Rejects Booking
   ↓
6. If Accepted: Booking Status → "confirmed"
   ↓
7. BOOKING_CONFIRMED Event → SQS (Confirmation Queue)
   ↓
8. Consumer Service Processes Confirmation
```

## API Endpoints

### Booking Creation
**Endpoint:** `POST /bookings`

**Request Body:**
```json
{
  "slotId": "string",
  "userId": "string"
}
```

**Response (201 Created):**
```json
{
  "id": "string",
  "userId": "string",
  "providerId": "string",
  "slotId": "string",
  "start": "2025-02-19T10:00:00Z",
  "end": "2025-02-19T11:00:00Z",
  "status": "pending"
}
```

**Process:**
1. Validates slot exists and is available
2. Creates booking with `pending` status
3. Publishes `BOOKING_CREATED` event to SQS
4. Returns booking details immediately

---

### Provider Accept Booking
**Endpoint:** `POST /providers/:providerId/bookings/:bookingId/accept`

**Response (200 OK):**
```json
{
  "message": "Booking accepted successfully",
  "booking": {
    "id": "string",
    "userId": "string",
    "providerId": "string",
    "slotId": "string",
    "start": "2025-02-19T10:00:00Z",
    "end": "2025-02-19T11:00:00Z",
    "status": "confirmed"
  }
}
```

**Process:**
1. Verifies booking exists and belongs to provider
2. Verifies booking status is `pending`
3. Updates booking status to `confirmed`
4. Publishes `BOOKING_CONFIRMED` event to SQS (Confirmation Queue)
5. Returns updated booking

**Error Responses:**
- `404` - Booking not found or doesn't belong to provider
- `409` - Booking cannot be accepted (wrong status)

---

### Provider Reject Booking
**Endpoint:** `POST /providers/:providerId/bookings/:bookingId/reject`

**Response (200 OK):**
```json
{
  "message": "Booking rejected successfully",
  "booking": {
    "id": "string",
    "userId": "string",
    "providerId": "string",
    "slotId": "string",
    "start": "2025-02-19T10:00:00Z",
    "end": "2025-02-19T11:00:00Z",
    "status": "rejected"
  }
}
```

**Process:**
1. Verifies booking exists and belongs to provider
2. Verifies booking status is `pending`
3. Updates booking status to `rejected`
4. Note: No SQS event published for rejection (can be added if needed)
5. Returns updated booking

**Error Responses:**
- `404` - Booking not found or doesn't belong to provider
- `409` - Booking cannot be rejected (wrong status)

---

## SQS Events

### Event 1: BOOKING_CREATED

**Queue:** `SQS_BOOKING_REQUEST_QUEUE_URL`

**Message Structure:**
```json
{
  "bookingId": "uuid",
  "userId": "uuid",
  "providerId": "uuid",
  "slotId": "uuid",
  "slotStart": "2025-02-19T10:00:00Z",
  "slotEnd": "2025-02-19T11:00:00Z",
  "eventType": "BOOKING_CREATED",
  "timestamp": "2025-02-19T09:55:00Z"
}
```

**Message Attributes:**
- `EventType` (String): "BOOKING_CREATED"
- `BookingId` (String): Booking ID
- `ProviderId` (String): Provider ID

**Consumer:** Provider service consumes this event to notify provider of new booking requests

---

### Event 2: BOOKING_CONFIRMED

**Queue:** `SQS_BOOKING_CONFIRMATION_QUEUE_URL`

**Message Structure:**
```json
{
  "bookingId": "uuid",
  "providerId": "uuid",
  "acceptedAt": "2025-02-19T10:02:00Z",
  "eventType": "BOOKING_CONFIRMED",
  "timestamp": "2025-02-19T10:02:00Z"
}
```

**Message Attributes:**
- `EventType` (String): "BOOKING_CONFIRMED"
- `BookingId` (String): Booking ID
- `ProviderId` (String): Provider ID

**Consumer:** User service or notification service consumes this event to confirm booking to user

---

## Environment Variables

Add the following to your `.env` file:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# SQS Queue URLs
SQS_BOOKING_REQUEST_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/your-account-id/booking-request-queue
SQS_BOOKING_CONFIRMATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/your-account-id/booking-confirmation-queue
```

---

## Database Changes

The existing `bookings` table already supports the booking status field. The status values are:
- `pending` - Initial state after booking creation
- `confirmed` - Provider accepted the booking
- `rejected` - Provider rejected the booking
- `cancelled` - User cancelled the booking (can add later if needed)

No schema changes required.

---

## File Changes Summary

### New Files Created:
- `src/infra/messaging/sqs-client.ts` - SQS client and event publishing functions

### Updated Files:
- `src/domains/bookings/booking.repository.ts`
  - Added `updateBookingStatus()` - Update booking status
  - Added `findById()` - Find booking by ID
  - Added `findByIdAndProviderId()` - Find booking by ID and provider ID

- `src/domains/bookings/booking.service.ts`
  - Added `acceptBooking()` - Accept a pending booking
  - Added `rejectBooking()` - Reject a pending booking
  - Added SQS event publishing for booking creation and confirmation
  - Environment variable configuration for queue URLs

- `src/domains/providers/provider.routes.ts`
  - Added `POST /providers/:providerId/bookings/:bookingId/accept` - Accept booking
  - Added `POST /providers/:providerId/bookings/:bookingId/reject` - Reject booking
  - Integrated BookingService

- `package.json`
  - Added `@aws-sdk/client-sqs` dependency

---

## Error Handling

All SQS event publishing is wrapped in try-catch blocks and logged. If event publishing fails:
- The API call still succeeds (events are not critical to booking creation)
- A warning is logged for monitoring/debugging
- The system gracefully degrades

This ensures that service availability is not impacted by SQS failures.

---

## Example Usage

### 1. Create a Booking
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "slot-123",
    "userId": "user-456"
  }'
```

### 2. Provider Accepts Booking
```bash
curl -X POST http://localhost:3000/providers/provider-789/bookings/booking-101/accept \
  -H "Content-Type: application/json"
```

### 3. Provider Rejects Booking
```bash
curl -X POST http://localhost:3000/providers/provider-789/bookings/booking-101/reject \
  -H "Content-Type: application/json"
```

---

## Future Enhancements

1. **Consumer Service Setup**
   - Create consumer service to process BOOKING_CREATED events
   - Send notifications to providers

2. **User Notifications**
   - Create consumer for BOOKING_CONFIRMED events
   - Send confirmation emails/SMS to users

3. **Booking Cancellation**
   - Add cancellation endpoint
   - Publish BOOKING_CANCELLED event

4. **Audit Trail**
   - Add audit logging for all booking state transitions
   - Track event publishing success/failure

5. **Dead Letter Queue**
   - Configure DLQ for failed messages
   - Implement retry mechanism with exponential backoff
