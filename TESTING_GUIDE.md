# Testing Guide: SQS Booking Flow

Complete guide for testing the new booking flow with SQS event integration.

## Prerequisites

### 1. Start the Application
```bash
npm install
npm run dev
```
The server should run on `http://localhost:3000`

### 2. Database Setup
Ensure PostgreSQL is running and migrations are applied:
```bash
# Run migrations (if your setup script does this automatically)
# Otherwise, manually execute SQL files in migrations/ folder
```

### 3. AWS Configuration
Create `.env` file with:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Option 1: Real AWS SQS
SQS_BOOKING_REQUEST_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR-ACCOUNT-ID/booking-request-queue
SQS_BOOKING_CONFIRMATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR-ACCOUNT-ID/booking-confirmation-queue

# Option 2: LocalStack (see LocalStack section below)
# SQS_BOOKING_REQUEST_QUEUE_URL=http://localhost:4566/000000000000/booking-request-queue
# SQS_BOOKING_CONFIRMATION_QUEUE_URL=http://localhost:4566/000000000000/booking-confirmation-queue
```

---

## Test Scenario 1: Happy Path (Booking Created & Accepted)

### Step 1: Get Provider ID
```bash
curl http://localhost:3000/providers | jq '.[0].id'
```
**Expected:** Provider ID (e.g., `1`)

### Step 2: Get User ID
```bash
curl http://localhost:3000/users | jq '.[0].id'
```
**Expected:** User ID (e.g., `1`)

### Step 3: Get Available Slot ID
```bash
curl http://localhost:3000/slots?providerId=1 | jq '.[0].id'
```
**Expected:** Slot ID (e.g., `1`) with `isBooked: false`

### Step 4: Create Booking
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "1",
    "userId": "1"
  }' | jq .
```

**Expected Response (201 Created):**
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

**Background Action:** 
- Event `BOOKING_CREATED` is published to SQS
- Check CloudWatch logs or SQS queue for message

### Step 5: Provider Accepts Booking
```bash
curl -X POST http://localhost:3000/providers/1/bookings/1/accept \
  -H "Content-Type: application/json" | jq .
```

**Expected Response (200 OK):**
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

**Background Action:**
- Event `BOOKING_CONFIRMED` is published to SQS
- Booking status changed from `pending` to `confirmed`

### Step 6: Verify Booking Status
```bash
curl http://localhost:3000/bookings | jq '.[] | select(.id == "1")'
```

**Expected:** Booking with `status: "confirmed"`

---

## Test Scenario 2: Provider Rejects Booking

Follow steps 1-4 from Scenario 1, then:

### Step 5: Provider Rejects Booking
```bash
curl -X POST http://localhost:3000/providers/1/bookings/1/reject \
  -H "Content-Type: application/json" | jq .
```

**Expected Response (200 OK):**
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

### Step 6: Verify Slot is Available Again (Optional)
If slot reservation is released on rejection:
```bash
curl http://localhost:3000/slots/1 | jq '.'
```

---

## Test Scenario 3: Error Cases

### 3.1: Invalid Slot ID
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "999999",
    "userId": "1"
  }'
```

**Expected (404):**
```json
{
  "error": "Slot not found"
}
```

### 3.2: Already Booked Slot
Create a booking (Scenario 1, Step 4), then try with same slot:
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "1",
    "userId": "2"
  }'
```

**Expected (409):**
```json
{
  "error": "Slot is already booked"
}
```

### 3.3: Accept Non-Pending Booking
Accept a booking (Scenario 1, Step 5), then try to accept again:
```bash
curl -X POST http://localhost:3000/providers/1/bookings/1/accept
```

**Expected (409):**
```json
{
  "error": "Cannot accept booking with status: confirmed"
}
```

### 3.4: Wrong Provider ID
```bash
curl -X POST http://localhost:3000/providers/999/bookings/1/accept
```

**Expected (404):**
```json
{
  "error": "Booking not found or does not belong to this provider"
}
```

### 3.5: Missing Required Fields
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "1"
  }'
```

**Expected (400):**
```json
{
  "error": "slotId and userId are required"
}
```

---

## LocalStack Testing (No AWS Account Needed)

### 1. Install Docker & Docker Compose
```bash
brew install docker docker-compose  # macOS
# or use Docker Desktop
```

### 2. Create docker-compose.yml
```yaml
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=sqs
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - "${TMPDIR}:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
```

### 3. Start LocalStack
```bash
docker-compose up -d
```

### 4. Create SQS Queues
```bash
# Create booking request queue
aws sqs create-queue \
  --queue-name booking-request-queue \
  --endpoint-url http://localhost:4566 \
  --region us-east-1

# Create booking confirmation queue
aws sqs create-queue \
  --queue-name booking-confirmation-queue \
  --endpoint-url http://localhost:4566 \
  --region us-east-1

# List queues to verify
aws sqs list-queues --endpoint-url http://localhost:4566
```

### 5. Set Environment Variables
```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
export SQS_BOOKING_REQUEST_QUEUE_URL=http://localhost:4566/000000000000/booking-request-queue
export SQS_BOOKING_CONFIRMATION_QUEUE_URL=http://localhost:4566/000000000000/booking-confirmation-queue
```

### 6. Run Tests
All test scenarios above will work with LocalStack!

### 7. Verify Messages in Queue
```bash
# Receive messages from booking request queue
aws sqs receive-message \
  --queue-url http://localhost:4566/000000000000/booking-request-queue \
  --endpoint-url http://localhost:4566 \
  --region us-east-1

# Receive messages from confirmation queue
aws sqs receive-message \
  --queue-url http://localhost:4566/000000000000/booking-confirmation-queue \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

---

## Monitoring SQS Messages

### Using AWS Console
1. Go to AWS SQS
2. Select queue
3. Click "Send and receive messages"
4. Click "Poll for messages"
5. Messages will appear with Body content

### Using AWS CLI
```bash
# Check queue attributes
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789/booking-request-queue \
  --attribute-names All

# Show message count
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789/booking-request-queue \
  --attribute-names ApproximateNumberOfMessages
```

### Using CloudWatch
1. Go to CloudWatch → Logs
2. Search for application logs
3. Filter by "SQS" to see publishing events

---

## Test with Postman/Insomnia

### Import this collection:

```json
{
  "info": {
    "name": "Booking Flow Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Booking",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": {"raw": "{{baseUrl}}/bookings", "host": ["bookings"]},
        "body": {
          "mode": "raw",
          "raw": "{\"slotId\": \"1\", \"userId\": \"1\"}"
        }
      }
    },
    {
      "name": "Accept Booking",
      "request": {
        "method": "POST",
        "url": {"raw": "{{baseUrl}}/providers/1/bookings/1/accept"},
        "header": [{"key": "Content-Type", "value": "application/json"}]
      }
    },
    {
      "name": "Reject Booking",
      "request": {
        "method": "POST",
        "url": {"raw": "{{baseUrl}}/providers/1/bookings/1/reject"},
        "header": [{"key": "Content-Type", "value": "application/json"}]
      }
    },
    {
      "name": "Get All Bookings",
      "request": {
        "method": "GET",
        "url": {"raw": "{{baseUrl}}/bookings"}
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:3000"}
  ]
}
```

### Steps
1. Import this JSON into Postman/Insomnia
2. Set `baseUrl` variable to `http://localhost:3000`
3. Create a booking
4. Note the booking ID from response
5. Update accept/reject requests with correct booking ID
6. Run requests in order

---

## Automated Testing Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Testing Booking Flow ==="

# Create booking
echo "Creating booking..."
BOOKING=$(curl -s -X POST $BASE_URL/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId": "1", "userId": "1"}')

BOOKING_ID=$(echo $BOOKING | jq -r '.id')
PROVIDER_ID=$(echo $BOOKING | jq -r '.providerId')
STATUS=$(echo $BOOKING | jq -r '.status')

echo "✓ Booking created: $BOOKING_ID"
echo "  Status: $STATUS"
echo "  Provider ID: $PROVIDER_ID"

# Accept booking
echo ""
echo "Accepting booking..."
ACCEPTED=$(curl -s -X POST $BASE_URL/providers/$PROVIDER_ID/bookings/$BOOKING_ID/accept \
  -H "Content-Type: application/json")

NEW_STATUS=$(echo $ACCEPTED | jq -r '.booking.status')
echo "✓ Booking accepted"
echo "  New Status: $NEW_STATUS"

# Verify final status
echo ""
echo "Verifying booking status..."
FINAL=$(curl -s $BASE_URL/bookings | jq ".[] | select(.id == \"$BOOKING_ID\")")
FINAL_STATUS=$(echo $FINAL | jq -r '.status')

if [ "$FINAL_STATUS" == "confirmed" ]; then
  echo "✓ All tests passed!"
else
  echo "✗ Test failed: Expected status 'confirmed', got '$FINAL_STATUS'"
fi
```

Save as `test-booking-flow.sh` and run:
```bash
chmod +x test-booking-flow.sh
./test-booking-flow.sh
```

---

## Performance Testing

### Load Test with Apache Bench
```bash
# Create 100 bookings
ab -n 100 -c 10 -p booking.json \
  -T application/json \
  http://localhost:3000/bookings

# Where booking.json contains:
# {"slotId": "1", "userId": "1"}
```

### Load Test with Apache JMeter
1. Create a test plan with HTTP sampler
2. Add 1000 threads
3. Ramp-up time: 10 seconds
4. Send POST requests to `/bookings`
5. Monitor response times and errors

---

## Key Validation Checks

### ✅ Verify in Logs
```bash
# Look for SQS publishing logs
npm run dev | grep SQS

# Expected output:
# [SQS] Published booking request event: <message-id>
# [SQS] Published booking confirmation event: <message-id>
```

### ✅ Verify in Database
```sql
-- Check booking status
SELECT id, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5;

-- Check slot is marked as booked
SELECT id, is_booked FROM availability WHERE id = 1;

-- View audit history (if using 006_booking_status_history.sql)
SELECT * FROM booking_status_history ORDER BY changed_at DESC;
```

### ✅ Verify in SQS
Either AWS Console, AWS CLI, or LocalStack CLI to check queue messages

---

## Troubleshooting

### Issue: SQS Events Not Publishing
**Check:**
1. Environment variables are set: `echo $SQS_BOOKING_REQUEST_QUEUE_URL`
2. AWS credentials are valid: `aws sts get-caller-identity`
3. Queue exists: `aws sqs list-queues`
4. Check application logs for errors

### Issue: 409 Conflict on Accept
**Reason:** Booking may have been accepted already or is in wrong status
**Fix:** Create new booking and try again

### Issue: Database Connection Issues
**Check:**
1. PostgreSQL is running
2. `.env` has correct DB credentials
3. Migrations have been applied
4. `npm install` dependencies are installed

### Issue: LocalStack Connection Refused
**Fix:**
```bash
docker-compose down  # Stop
docker-compose up -d # Restart
docker ps            # Verify localstack is running
```

---

## Summary Checklist

- [ ] Application starts without errors (`npm run dev`)
- [ ] Database is accessible
- [ ] Create booking returns 201 with status `pending`
- [ ] SQS event is published (check logs)
- [ ] Accept booking returns 200 with status `confirmed`
- [ ] Confirmation event is published
- [ ] Reject booking returns 200 with status `rejected`
- [ ] Invalid requests return appropriate error codes
- [ ] Database reflects all status changes
- [ ] All TypeScript types are correct (`npm run type-check`)

If all checks pass, implementation is working correctly! ✅
