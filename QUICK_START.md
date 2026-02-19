# ⚡ Quick Start Guide

Get up and running with the SQS-enabled booking system in 5 minutes.

---

## 📦 Prerequisites

- Node.js 18+
- PostgreSQL 11+
- AWS Account (optional - for real SQS)
- npm 7+

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 minute)
```bash
cd /Users/deepakchaudhry/work/learning/local-service-booking
npm install
```

### Step 2: Configure Environment (1 minute)
```bash
cp .env.example .env

# Edit .env - three options:
# Option 1: Leave empty (development mode)
# Option 2: Add real AWS credentials and queue URLs
# Option 3: Use LocalStack (docker-compose up -d)
```

### Step 3: Start Application (30 seconds)
```bash
npm run dev
```

Application runs on `http://localhost:3000`

### Step 4: Create Your First Booking (2 minutes)
```bash
# Create a booking
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "1",
    "userId": "1"
  }'

# You should see:
# {
#   "id": "1",
#   "userId": "1",
#   "providerId": "1",
#   "slotId": "1",
#   "start": "2025-02-19T10:00:00Z",
#   "end": "2025-02-19T11:00:00Z",
#   "status": "pending"
# }
```

### Step 5: Accept the Booking (30 seconds)
```bash
# Provider accepts the booking
curl -X POST http://localhost:3000/providers/1/bookings/1/accept \
  -H "Content-Type: application/json"

# You should see:
# {
#   "message": "Booking accepted successfully",
#   "booking": {
#     "id": "1",
#     "status": "confirmed"
#     ...
#   }
# }
```

✅ **Done!** Your booking is confirmed!

---

## 📚 Next Steps

### Want to Learn More?
- [BOOKING_FLOW.md](BOOKING_FLOW.md) - Complete architecture
- [API_REFERENCE.md](API_REFERENCE.md) - All endpoints
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Navigation guide

### Want to Test?
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
- See [Testing](#testing-your-setup) below

### Want to Deploy?
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Full checklist

### Want to Build Consumers?
- [CONSUMER_GUIDE.md](CONSUMER_GUIDE.md) - Consumer examples

---

## 🧪 Testing Your Setup

### Check Application Health
```bash
# Application should be running and responsive
curl http://localhost:3000/bookings
# Should return: []
```

### Check Database Connection
```bash
# Create a fake booking to test
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId": "999", "userId": "999"}'
# Should return 404: Slot not found
```

### Check TypeScript
```bash
npm run type-check
# Should show: no errors
```

---

## 🔧 Commands Reference

```bash
# Development
npm run dev              # Start with hot reload

# Production
npm run build           # Build TypeScript
npm start              # Run production build

# Type checking
npm run type-check     # Check TypeScript types

# Useful for debugging
npm run dev | grep SQS  # See SQS events
npm run dev | grep ERROR  # See errors
```

---

## 🔐 Configuration (3 Options)

### Option 1: Development (No SQS)
```bash
# Leave queue URLs empty/commented in .env
# Events will log but won't publish
npm run dev
```

### Option 2: Real AWS SQS
```bash
# In .env:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
SQS_BOOKING_REQUEST_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/ACCOUNT/booking-request-queue
SQS_BOOKING_CONFIRMATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/ACCOUNT/booking-confirmation-queue

npm run dev
```

### Option 3: LocalStack (Local SQS Emulator)
```bash
# Start LocalStack
docker-compose up -d

# Create queues
aws sqs create-queue --queue-name booking-request-queue --endpoint-url http://localhost:4566
aws sqs create-queue --queue-name booking-confirmation-queue --endpoint-url http://localhost:4566

# In .env:
SQS_BOOKING_REQUEST_QUEUE_URL=http://localhost:4566/000000000000/booking-request-queue
SQS_BOOKING_CONFIRMATION_QUEUE_URL=http://localhost:4566/000000000000/booking-confirmation-queue

npm run dev
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md#localstack-testing-no-aws-account-needed) for detailed LocalStack setup.

---

## 📡 API Quick Reference

### Create Booking
```bash
POST /bookings
Body: {"slotId": "1", "userId": "1"}
Response: Booking object with status: "pending"
Event: BOOKING_CREATED → SQS Queue 1
```

### Accept Booking
```bash
POST /providers/:providerId/bookings/:bookingId/accept
Response: Booking object with status: "confirmed"
Event: BOOKING_CONFIRMED → SQS Queue 2
```

### Reject Booking
```bash
POST /providers/:providerId/bookings/:bookingId/reject
Response: Booking object with status: "rejected"
```

### List Bookings
```bash
GET /bookings
Response: Array of all bookings
```

See [API_REFERENCE.md](API_REFERENCE.md) for complete documentation.

---

## ❓ Troubleshooting

### Application won't start
```bash
# Check for TypeScript errors
npm run type-check

# Check dependencies installed
npm install

# Check port 3000 is available
lsof -i :3000
```

### Database connection error
```bash
# Verify PostgreSQL is running
psql -U postgres -h localhost

# Check .env has correct DB settings
# Run migrations if not applied
```

### SQS events not publishing
```bash
# Check .env has queue URLs set
echo $SQS_BOOKING_REQUEST_QUEUE_URL

# Check AWS credentials
aws sts get-caller-identity

# Check queues exist
aws sqs list-queues
```

### Import errors in TypeScript
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md#troubleshooting) or [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md#troubleshooting-guide) for more help.

---

## 📖 Documentation Map

| Need | File |
|------|------|
| Architecture | [BOOKING_FLOW.md](BOOKING_FLOW.md) |
| API Endpoints | [API_REFERENCE.md](API_REFERENCE.md) |
| Testing | [TESTING_GUIDE.md](TESTING_GUIDE.md) |
| Deployment | [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) |
| Consumer Services | [CONSUMER_GUIDE.md](CONSUMER_GUIDE.md) |
| Diagrams | [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) |
| Navigation | [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) |

---

## 🎯 What Happens

### When You Create a Booking
1. ✅ Slot is marked as booked
2. ✅ Booking created with status `pending`
3. ✅ `BOOKING_CREATED` event published to SQS
4. ✅ API returns booking details immediately

### When Provider Accepts
1. ✅ Booking status changed to `confirmed`
2. ✅ `BOOKING_CONFIRMED` event published to SQS
3. ✅ API returns updated booking

### When Provider Rejects
1. ✅ Booking status changed to `rejected`
2. ✅ API returns updated booking

---

## 💡 Pro Tips

### Use Postman for Testing
Import the collection from [TESTING_GUIDE.md](TESTING_GUIDE.md#test-with-postmaninsomnia)

### View Application Logs
```bash
npm run dev | grep -E 'created|confirmed|ERROR'
```

### Monitor SQS Messages
```bash
# For LocalStack
aws sqs receive-message \
  --queue-url http://localhost:4566/000000000000/booking-request-queue \
  --endpoint-url http://localhost:4566
```

### Test with Real Data
See [TESTING_GUIDE.md](TESTING_GUIDE.md#test-scenario-1-happy-path) for step-by-step guide

---

## ✅ Success Checklist

After 5 minutes, you should have:
- [ ] Application running on localhost:3000
- [ ] Can create a booking with POST /bookings
- [ ] Can accept a booking with POST /providers/:id/bookings/:id/accept
- [ ] Booking status changes from pending to confirmed
- [ ] No TypeScript errors
- [ ] No database errors in logs

If all ✅, you're ready to go!

---

## 🚀 Next Level

### Production Deployment
Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### Building Consumers
Follow [CONSUMER_GUIDE.md](CONSUMER_GUIDE.md)

### Comprehensive Testing
Follow [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## 📞 Need Help?

1. Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for navigation
2. See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md#troubleshooting-guide)
3. Review [TESTING_GUIDE.md](TESTING_GUIDE.md#troubleshooting)
4. Check application logs: `npm run dev`

---

**Time to get started:** 5 minutes ⏱️

Start with [BOOKING_FLOW.md](BOOKING_FLOW.md) for detailed documentation!
