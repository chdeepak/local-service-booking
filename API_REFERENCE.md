# API Reference: Complete Booking Flow

Comprehensive API reference with all request/response examples.

---

## Base URL
```
http://localhost:3000
```

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | Get all bookings |
| POST | `/bookings` | Create new booking |
| POST | `/providers/:providerId/bookings/:bookingId/accept` | Accept booking (provider) |
| POST | `/providers/:providerId/bookings/:bookingId/reject` | Reject booking (provider) |

---

## 1. Create Booking

### Endpoint
```
POST /bookings
```

### Description
Create a new booking request. This immediately reserves a slot and publishes a `BOOKING_CREATED` event to SQS.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "slotId": "1",
  "userId": "1"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slotId | String | Yes | ID of the available slot |
| userId | String | Yes | ID of the user making the booking |

### Response

**Status: 201 Created**

```json
{
  "id": "1",
  "userId": "1",
  "providerId": "1",
  "slotId": "1",
  "start": "2025-02-19T10:00:00Z",
  "end": "2025-02-19T11:00:00Z",
  "status": "pending"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique booking identifier |
| userId | String | ID of the user who booked |
| providerId | String | ID of the provider |
| slotId | String | ID of the booked slot |
| start | ISO DateTime | Slot start time |
| end | ISO DateTime | Slot end time |
| status | String | Current booking status: `pending` |

### Side Effects
- Slot is marked as booked in database
- Event `BOOKING_CREATED` is published to SQS queue: `SQS_BOOKING_REQUEST_QUEUE_URL`
- Provider service can consume this event to notify provider

### Error Responses

**400 Bad Request**
```json
{
  "error": "slotId and userId are required"
}
```

**404 Not Found**
```json
{
  "error": "Slot not found"
}
```

**409 Conflict** (Slot already booked)
```json
{
  "error": "Slot is already booked"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to create booking"
}
```

### Example cURL Request
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "1",
    "userId": "1"
  }'
```

### Example cURL Response
```json
{
  "id": "1",
  "userId": "1",
  "providerId": "1",
  "slotId": "1",
  "start": "2025-02-19T10:00:00Z",
  "end": "2025-02-19T11:00:00Z",
  "status": "pending"
}
```

---

## 2. Accept Booking (Provider)

### Endpoint
```
POST /providers/:providerId/bookings/:bookingId/accept
```

### Description
Provider accepts a pending booking. Changes booking status to `confirmed` and publishes a `BOOKING_CONFIRMED` event to SQS.

### Request

**Headers:**
```
Content-Type: application/json
```

**URL Parameters:**
- `:providerId` - ID of the provider
- `:bookingId` - ID of the booking to accept

### Response

**Status: 200 OK**

```json
{
  "message": "Booking accepted successfully",
  "booking": {
    "id": "1",
    "userId": "1",
    "providerId": "1",
    "slotId": "1",
    "start": "2025-02-19T10:00:00Z",
    "end": "2025-02-19T11:00:00Z",
    "status": "confirmed"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String | Success message |
| booking | Object | Updated booking details |
| booking.id | String | Booking ID |
| booking.userId | String | User ID |
| booking.providerId | String | Provider ID |
| booking.slotId | String | Slot ID |
| booking.start | ISO DateTime | Slot start time |
| booking.end | ISO DateTime | Slot end time |
| booking.status | String | New status: `confirmed` |

### Side Effects
- Booking status updated from `pending` to `confirmed` in database
- Event `BOOKING_CONFIRMED` is published to SQS queue: `SQS_BOOKING_CONFIRMATION_QUEUE_URL`
- User service can consume this event to send confirmation to user

### Error Responses

**400 Bad Request** (Missing parameters)
```json
{
  "error": "providerId and bookingId are required"
}
```

**404 Not Found** (Booking not found or wrong provider)
```json
{
  "error": "Booking not found or does not belong to this provider"
}
```

**409 Conflict** (Wrong status)
```json
{
  "error": "Cannot accept booking with status: confirmed"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to accept booking"
}
```

### Example cURL Request
```bash
curl -X POST http://localhost:3000/providers/1/bookings/1/accept \
  -H "Content-Type: application/json"
```

### Example cURL Response
```json
{
  "message": "Booking accepted successfully",
  "booking": {
    "id": "1",
    "userId": "1",
    "providerId": "1",
    "slotId": "1",
    "start": "2025-02-19T10:00:00Z",
    "end": "2025-02-19T11:00:00Z",
    "status": "confirmed"
  }
}
```

---

## 3. Reject Booking (Provider)

### Endpoint
```
POST /providers/:providerId/bookings/:bookingId/reject
```

### Description
Provider rejects a pending booking. Changes booking status to `rejected`.

### Request

**Headers:**
```
Content-Type: application/json
```

**URL Parameters:**
- `:providerId` - ID of the provider
- `:bookingId` - ID of the booking to reject

### Response

**Status: 200 OK**

```json
{
  "message": "Booking rejected successfully",
  "booking": {
    "id": "1",
    "userId": "1",
    "providerId": "1",
    "slotId": "1",
    "start": "2025-02-19T10:00:00Z",
    "end": "2025-02-19T11:00:00Z",
    "status": "rejected"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String | Success message |
| booking | Object | Updated booking details |
| booking.status | String | New status: `rejected` |

### Side Effects
- Booking status updated from `pending` to `rejected` in database
- **Note:** Slot is NOT automatically released (can be modified if needed)
- No event published for rejection (can be added if needed)

### Error Responses

**400 Bad Request**
```json
{
  "error": "providerId and bookingId are required"
}
```

**404 Not Found**
```json
{
  "error": "Booking not found or does not belong to this provider"
}
```

**409 Conflict** (Wrong status)
```json
{
  "error": "Cannot reject booking with status: rejected"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to reject booking"
}
```

### Example cURL Request
```bash
curl -X POST http://localhost:3000/providers/1/bookings/1/reject \
  -H "Content-Type: application/json"
```

### Example cURL Response
```json
{
  "message": "Booking rejected successfully",
  "booking": {
    "id": "1",
    "userId": "1",
    "providerId": "1",
    "slotId": "1",
    "start": "2025-02-19T10:00:00Z",
    "end": "2025-02-19T11:00:00Z",
    "status": "rejected"
  }
}
```

---

## 4. Get All Bookings

### Endpoint
```
GET /bookings
```

### Description
Retrieve all bookings with their details.

### Request

**Headers:**
```
Content-Type: application/json
```

### Response

**Status: 200 OK**

```json
[
  {
    "id": "1",
    "userName": "John Doe",
    "providerName": "Jane's Salon",
    "slotStart": "2025-02-19T10:00:00Z",
    "slotEnd": "2025-02-19T11:00:00Z",
    "status": "confirmed"
  },
  {
    "id": "2",
    "userName": "Alice Smith",
    "providerName": "Bob's Barber",
    "slotStart": "2025-02-19T14:00:00Z",
    "slotEnd": "2025-02-19T15:00:00Z",
    "status": "pending"
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | String | Booking ID |
| userName | String | User's name |
| providerName | String | Provider's name |
| slotStart | ISO DateTime | Slot start time |
| slotEnd | ISO DateTime | Slot end time |
| status | String | Booking status |

### Status Values
- `pending` - Waiting for provider response
- `confirmed` - Provider accepted
- `rejected` - Provider rejected
- `cancelled` - User cancelled (future feature)

### Error Responses

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch bookings"
}
```

### Example cURL Request
```bash
curl http://localhost:3000/bookings
```

---

## Complete Workflow Example

### 1. Create Booking
```bash
# Step 1: Create a new booking
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId": "1", "userId": "1"}'

# Response:
# {
#   "id": "1",
#   "status": "pending"
# }
```

### 2. Provider Accepts
```bash
# Step 2: Provider accepts the booking
curl -X POST http://localhost:3000/providers/1/bookings/1/accept \
  -H "Content-Type: application/json"

# Response:
# {
#   "message": "Booking accepted successfully",
#   "booking": {
#     "status": "confirmed"
#   }
# }
```

### 3. Verify Final Status
```bash
# Step 3: Verify final status
curl http://localhost:3000/bookings | jq '.[] | select(.id == "1")'

# Response shows:
# "status": "confirmed"
```

---

## SQS Events Published

### Event 1: BOOKING_CREATED
**When:** After successful booking creation
**Queue:** `SQS_BOOKING_REQUEST_QUEUE_URL`

```json
{
  "bookingId": "1",
  "userId": "1",
  "providerId": "1",
  "slotId": "1",
  "slotStart": "2025-02-19T10:00:00Z",
  "slotEnd": "2025-02-19T11:00:00Z",
  "eventType": "BOOKING_CREATED",
  "timestamp": "2025-02-19T09:55:00Z"
}
```

**Message Attributes:**
- `EventType: "BOOKING_CREATED"`
- `BookingId: "1"`
- `ProviderId: "1"`

### Event 2: BOOKING_CONFIRMED
**When:** After provider accepts booking
**Queue:** `SQS_BOOKING_CONFIRMATION_QUEUE_URL`

```json
{
  "bookingId": "1",
  "providerId": "1",
  "acceptedAt": "2025-02-19T10:02:00Z",
  "eventType": "BOOKING_CONFIRMED",
  "timestamp": "2025-02-19T10:02:00Z"
}
```

**Message Attributes:**
- `EventType: "BOOKING_CONFIRMED"`
- `BookingId: "1"`
- `ProviderId: "1"`

---

## Status Codes Reference

| Code | Meaning | Used In |
|------|---------|---------|
| 200 | Success | Accept/Reject booking |
| 201 | Created | Create booking |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Slot or booking not found |
| 409 | Conflict | Wrong status or duplicate action |
| 500 | Server Error | Database or SQS errors |

---

## Headers & Content Type

All API endpoints expect and return JSON:

**Request Headers:**
```
Content-Type: application/json
```

**Response Headers:**
```
Content-Type: application/json; charset=utf-8
```

---

## Authentication & Authorization

**Currently:** No authentication implemented

**Future Enhancement:**
- Add Bearer token authentication
- Validate provider ownership of bookings
- Authorize user access to their bookings

---

## Rate Limiting

**Currently:** No rate limiting implemented

**Future Enhancement:**
- Implement per-user rate limiting
- Implement per-provider rate limiting
- Return `429 Too Many Requests` when limit exceeded

---

## Pagination

**Currently:** Not applicable (endpoints return all records)

**Future Enhancement:**
- Add `limit` and `offset` query parameters
- Return pagination metadata

Example:
```bash
GET /bookings?limit=10&offset=0
```

---

## Version Information

| Item | Value |
|------|-------|
| API Version | 1.0.0 |
| Node.js Version | 18+ |
| Express Version | 4.18.2 |
| PostgreSQL Version | 11+ |
