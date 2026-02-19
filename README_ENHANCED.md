# Local Service Booking - Enhanced with SQS Integration

A quick service booking platform with event-driven architecture using AWS SQS.

## 🎯 Overview

This system enables users to book service slots from providers. With the new SQS integration:

1. **User creates booking** → Event published to SQS
2. **Provider receives event** → Accepts or rejects booking  
3. **Booking confirmed** → Confirmation event published to SQS
4. **Consumer services** → Process events asynchronously

---

## ✨ Features

### Booking Management
- Create booking requests (status: `pending`)
- Accept pending bookings (status: `confirmed`)
- Reject pending bookings (status: `rejected`)
- View all bookings with details

### Event-Driven Architecture
- **BOOKING_CREATED** events published to SQS when booking is created
- **BOOKING_CONFIRMED** events published to SQS when provider accepts
- Asynchronous, non-blocking event publishing
- Graceful degradation if SQS is unavailable

### Database
- PostgreSQL with transaction support
- Row-level locking for slot availability
- Atomic status updates
- Foreign key relationships

### API Endpoints
```
GET    /bookings                                    - List all bookings
POST   /bookings                                    - Create new booking
POST   /providers/:providerId/bookings/:bookingId/accept   - Accept booking
POST   /providers/:providerId/bookings/:bookingId/reject   - Reject booking
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your AWS credentials and SQS queue URLs
```

### 3. Set up Database
```bash
# Ensure PostgreSQL is running
# Apply migrations (001-005)
psql -U postgres -d booking_db -f migrations/001_create_providers.sql
# ...apply all migrations
```

### 4. Start Application
```bash
npm run dev
```

The server will run on `http://localhost:3000`

---

## 📚 Documentation

Complete documentation available in these files:

| File | Purpose |
|------|---------|
| [BOOKING_FLOW.md](BOOKING_FLOW.md) | Architecture & complete API documentation |
| [API_REFERENCE.md](API_REFERENCE.md) | Detailed endpoint reference with examples |
| [CONSUMER_GUIDE.md](CONSUMER_GUIDE.md) | How to build consumer services |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing procedures & examples |
| [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) | Visual system diagrams |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Quick implementation reference |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Deployment & monitoring guide |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Implementation overview |

---

## 🔄 Booking Flow

```
1. User creates booking
   POST /bookings {slotId, userId}
   ↓
2. Booking created with status: pending
   Event: BOOKING_CREATED → SQS Queue 1
   ↓
3. Provider Service consumes event
   Sends notification to provider
   ↓
4. Provider accepts or rejects
   POST /providers/:id/bookings/:id/accept
   ↓
5. Booking status updated to confirmed/rejected
   Event: BOOKING_CONFIRMED → SQS Queue 2 (if accepted)
   ↓
6. User/Notification Service consumes event
   Sends confirmation to user
```

---

## 📋 API Examples

### Create Booking
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "1",
    "userId": "1"
  }'
```

**Response (201):**
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

### Provider Accepts Booking
```bash
curl -X POST http://localhost:3000/providers/1/bookings/1/accept \
  -H "Content-Type: application/json"
```

**Response (200):**
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

See [API_REFERENCE.md](API_REFERENCE.md) for complete endpoint documentation.

---

## 🔐 Setup SQS Queues

### Option 1: Real AWS
1. Create SQS queues in AWS console
2. Get queue URLs
3. Add to `.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SQS_BOOKING_REQUEST_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR-ID/booking-request-queue
SQS_BOOKING_CONFIRMATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR-ID/booking-confirmation-queue
```

### Option 2: LocalStack (Local SQS Emulator)
```bash
docker-compose up -d

# Create queues
aws sqs create-queue --queue-name booking-request-queue --endpoint-url http://localhost:4566
aws sqs create-queue --queue-name booking-confirmation-queue --endpoint-url http://localhost:4566
```

### Option 3: Development (No SQS)
Leave queue URLs empty in `.env`. Events will log but won't publish.

See [TESTING_GUIDE.md](TESTING_GUIDE.md#localstack-testing-no-aws-account-needed) for details.

---

## 📊 Events

### BOOKING_CREATED Event
Published: Immediately after booking creation
Queue: `SQS_BOOKING_REQUEST_QUEUE_URL`
Consumer: Provider Service

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

### BOOKING_CONFIRMED Event
Published: After provider accepts booking
Queue: `SQS_BOOKING_CONFIRMATION_QUEUE_URL`
Consumer: User Notification Service

```json
{
  "bookingId": "uuid",
  "providerId": "uuid",
  "acceptedAt": "2025-02-19T10:02:00Z",
  "eventType": "BOOKING_CONFIRMED",
  "timestamp": "2025-02-19T10:02:00Z"
}
```

---

## 🧪 Testing

### Manual Testing
```bash
# Create booking
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId": "1", "userId": "1"}'

# Accept booking
curl -X POST http://localhost:3000/providers/1/bookings/1/accept
```

### Automated Testing
See [TESTING_GUIDE.md](TESTING_GUIDE.md) for:
- Test scenarios
- LocalStack setup
- Performance testing
- Error case testing
- Test automation script

### With Postman
Import collection from [TESTING_GUIDE.md](TESTING_GUIDE.md#test-with-postmaninsomnia)

---

## 📁 Project Structure

```
src/
  app.ts                      - Express app setup
  main.ts                     - Application entry point
  server.ts                   - Server configuration
  
  config/
    db.ts                     - Database connection
    index.ts                  - Config exports
  
  domains/
    bookings/
      booking.entity.ts       - Booking interface
      booking.repository.ts   - Database operations
      booking.service.ts      - Business logic + SQS
      booking.routes.ts       - API routes
    
    providers/
      provider.entity.ts      - Provider interface
      provider.repository.ts  - Database operations
      provider.service.ts     - Business logic
      provider.routes.ts      - API routes (+ accept/reject)
    
    ... other domains
  
  infra/
    db/
      postgres.ts             - DB pool management
    messaging/
      sqs-client.ts           - SQS integration
    http/
    
  shared/
    errors.ts                 - Error definitions
    logger.ts                 - Logging utilities
    types.ts                  - Shared types
    utils.ts                  - Utility functions

migrations/
  001_create_providers.sql
  002_create_users.sql
  003_create_bookings.sql
  004_create_availability.sql
  005_seed_availability.sql
  006_booking_status_history.sql  - Optional audit trail

tests/
```

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build
npm run build

# Run in development (with hot reload via ts-node)
npm run dev

# Start production build
npm start
```

---

## 🔄 Booking States

| Status | Description | Transitions |
|--------|-------------|-------------|
| `pending` | New booking, awaiting provider review | → `confirmed` or `rejected` |
| `confirmed` | Provider accepted the booking | Final state |
| `rejected` | Provider rejected the booking | Final state |
| `cancelled` | User cancelled (future feature) | N/A |

---

## 🚀 Next Steps: Building Consumer Services

### Provider Service Consumer
Consumes `BOOKING_CREATED` events to notify providers.

```typescript
// See CONSUMER_GUIDE.md for complete example
const event = JSON.parse(message.Body);
// Send notification to provider about new booking request
await notificationService.sendToProvider(event);
```

### User Notification Consumer
Consumes `BOOKING_CONFIRMED` events to notify users.

```typescript
// See CONSUMER_GUIDE.md for complete example
const event = JSON.parse(message.Body);
// Send confirmation email/SMS to user
await notificationService.sendConfirmation(event);
```

Full implementation guide: [CONSUMER_GUIDE.md](CONSUMER_GUIDE.md)

---

## 📈 Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for:
- AWS account setup
- SQS queue creation
- Environment configuration
- Testing procedures
- Monitoring setup
- Troubleshooting guide

Quick deployment:
```bash
# 1. Verify types
npm run type-check

# 2. Build
npm run build

# 3. Set environment variables
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export SQS_BOOKING_REQUEST_QUEUE_URL=...
export SQS_BOOKING_CONFIRMATION_QUEUE_URL=...

# 4. Start
npm start
```

---

## 🐛 Troubleshooting

### SQS Events Not Publishing
1. Check environment variables: `echo $SQS_BOOKING_REQUEST_QUEUE_URL`
2. Verify AWS credentials: `aws sts get-caller-identity`
3. Check queue exists: `aws sqs list-queues`
4. Review logs: `npm run dev | grep SQS`

### Database Connection Failed
1. Verify PostgreSQL running: `psql -U postgres -h localhost`
2. Check .env credentials
3. Verify migrations applied

### Booking Creation Fails
1. Verify slot exists
2. Check slot is not booked
3. Review database logs

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md#troubleshooting-guide) for more solutions.

---

## 📞 Support

- **Documentation**: See files listed above
- **Testing Issues**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **API Questions**: [API_REFERENCE.md](API_REFERENCE.md)
- **Implementation Details**: [BOOKING_FLOW.md](BOOKING_FLOW.md)
- **Architecture**: [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
- **Deployment**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 📝 Implementation Details

### What Was Added
- AWS SQS messaging infrastructure
- Event publishing on booking creation & acceptance
- Provider accept/reject endpoints
- Complete documentation (7 files)
- Testing guide with examples
- Consumer service guide
- Architecture diagrams
- Deployment checklist

### Key Features
- ✅ Non-blocking async event publishing
- ✅ Graceful error handling
- ✅ Type-safe TypeScript
- ✅ Database transaction support
- ✅ Row-level locking for concurrency
- ✅ Comprehensive logging
- ✅ AWS SDK v3 integration

### Files Changed
- Created: 8 new files (code + documentation)
- Modified: 4 files (service layer + routes + config)
- Total Documentation: 7 detailed markdown files

---

## 📄 LICENSE

[Your License Here]

---

## 👥 Contributors

- Implementation Team

---

## 🔍 See Also

- [BOOKING_FLOW.md](BOOKING_FLOW.md) - Complete workflow documentation
- [API_REFERENCE.md](API_REFERENCE.md) - Full API reference
- [CONSUMER_GUIDE.md](CONSUMER_GUIDE.md) - Consumer service implementation
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing & validation
- [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - System diagrams

---

**Status: Production Ready** ✅

Start with [BOOKING_FLOW.md](BOOKING_FLOW.md) for complete documentation.
