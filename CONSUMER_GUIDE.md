# Consumer Service Implementation Guide

This guide helps you build consumer services to process the SQS events published by the booking service.

## Overview

Two main events are published:
1. **BOOKING_CREATED** → `SQS_BOOKING_REQUEST_QUEUE_URL` - When user creates booking
2. **BOOKING_CONFIRMED** → `SQS_BOOKING_CONFIRMATION_QUEUE_URL` - When provider accepts booking

## Provider Service Consumer (Listens to BOOKING_CREATED)

### Purpose
Notify provider of new booking requests

### Implementation Example

```typescript
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: 'us-east-1' });
const BOOKING_REQUEST_QUEUE_URL = process.env.SQS_BOOKING_REQUEST_QUEUE_URL!;

interface BookingRequestEvent {
  bookingId: string;
  userId: string;
  providerId: string;
  slotId: string;
  slotStart: string;
  slotEnd: string;
  eventType: 'BOOKING_CREATED';
  timestamp: string;
}

async function pollBookingRequests() {
  try {
    const { Messages } = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: BOOKING_REQUEST_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      })
    );

    if (!Messages || Messages.length === 0) {
      console.log('No messages received');
      return;
    }

    for (const message of Messages) {
      try {
        const event = JSON.parse(message.Body!) as BookingRequestEvent;
        
        console.log(`Processing booking request: ${event.bookingId}`);
        
        // TODO: Implement your business logic here
        // Examples:
        // 1. Send notification to provider
        // 2. Store in local database
        // 3. Trigger follow-up actions
        
        await handleBookingRequest(event);
        
        // Delete message from queue after successful processing
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: BOOKING_REQUEST_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle!,
          })
        );
        
        console.log(`Successfully processed booking: ${event.bookingId}`);
      } catch (error) {
        console.error('Error processing message:', error);
        // Message will be retried after visibility timeout
      }
    }
  } catch (error) {
    console.error('Error polling messages:', error);
  }
}

async function handleBookingRequest(event: BookingRequestEvent) {
  // Implement your business logic
  // For example, send email to provider
  console.log(`Provider ${event.providerId} has a new booking request:`);
  console.log(`  Booking ID: ${event.bookingId}`);
  console.log(`  Time: ${event.slotStart} - ${event.slotEnd}`);
  console.log(`  User ID: ${event.userId}`);
}

// Start polling
setInterval(pollBookingRequests, 5000); // Poll every 5 seconds
```

## User Service Consumer (Listens to BOOKING_CONFIRMED)

### Purpose
Notify user that provider has accepted their booking

### Implementation Example

```typescript
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: 'us-east-1' });
const BOOKING_CONFIRMATION_QUEUE_URL = process.env.SQS_BOOKING_CONFIRMATION_QUEUE_URL!;

interface BookingConfirmationEvent {
  bookingId: string;
  providerId: string;
  acceptedAt: string;
  eventType: 'BOOKING_CONFIRMED';
  timestamp: string;
}

async function pollBookingConfirmations() {
  try {
    const { Messages } = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: BOOKING_CONFIRMATION_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      })
    );

    if (!Messages || Messages.length === 0) {
      console.log('No confirmation messages');
      return;
    }

    for (const message of Messages) {
      try {
        const event = JSON.parse(message.Body!) as BookingConfirmationEvent;
        
        console.log(`Processing booking confirmation: ${event.bookingId}`);
        
        // TODO: Implement your business logic here
        // Examples:
        // 1. Send confirmation email to user
        // 2. Send SMS notification
        // 3. Update user dashboard
        
        await handleBookingConfirmation(event);
        
        // Delete message from queue
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: BOOKING_CONFIRMATION_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle!,
          })
        );
        
        console.log(`Successfully handled confirmation: ${event.bookingId}`);
      } catch (error) {
        console.error('Error processing confirmation:', error);
      }
    }
  } catch (error) {
    console.error('Error polling confirmations:', error);
  }
}

async function handleBookingConfirmation(event: BookingConfirmationEvent) {
  // Implement your business logic
  console.log(`Booking ${event.bookingId} has been confirmed!`);
  console.log(`Accepted at: ${event.acceptedAt}`);
  console.log(`Provider ID: ${event.providerId}`);
  
  // Send notification email to user
  // await emailService.sendConfirmationEmail(userId, bookingDetails);
}

// Start polling
setInterval(pollBookingConfirmations, 5000);
```

## Best Practices

### 1. Error Handling
- Catch errors for individual messages
- Don't stop consumer on error
- Log errors for debugging
- Failed messages will be retried (moved back to queue after visibility timeout)

### 2. Message Processing
- Always delete message after successful processing
- If message processing fails, don't delete it (auto-retry)
- Use Dead Letter Queue (DLQ) for persistent failures

### 3. Scaling
- Use multiple instances of consumers
- SQS distributes messages across instances
- Messages are processed exactly-once (with proper handling)

### 4. Monitoring
- Log all event processing
- Track processing time
- Monitor error rates
- Set up CloudWatch alarms

### 5. Configuration
```env
# Add to .env
SQS_BOOKING_REQUEST_QUEUE_URL=...
SQS_BOOKING_CONFIRMATION_QUEUE_URL=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Testing with AWS CLI

### Send Test Message
```bash
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789/booking-request-queue \
  --message-body '{"bookingId":"test-123","userId":"user-456","providerId":"provider-789","slotId":"slot-001","slotStart":"2025-02-19T10:00:00Z","slotEnd":"2025-02-19T11:00:00Z","eventType":"BOOKING_CREATED","timestamp":"2025-02-19T09:55:00Z"}' \
  --region us-east-1
```

### Receive Messages
```bash
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789/booking-request-queue \
  --region us-east-1
```

### Delete Message
```bash
aws sqs delete-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789/booking-request-queue \
  --receipt-handle <receipt-handle-from-receive> \
  --region us-east-1
```

## AWS IAM Permissions

Consumers need these SQS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": [
        "arn:aws:sqs:us-east-1:123456789012:booking-request-queue",
        "arn:aws:sqs:us-east-1:123456789012:booking-confirmation-queue"
      ]
    }
  ]
}
```

## Integration with Your Services

### Provider Service
- Consume BOOKING_CREATED events
- Send notifications to providers
- Store booking requests locally
- Reference: Implementation example above

### User/Notification Service
- Consume BOOKING_CONFIRMED events
- Send confirmation emails/SMS
- Update user profile
- Reference: Implementation example above

## Troubleshooting

### Messages Not Being Received
1. Check queue URL is correct
2. Verify AWS credentials are set
3. Ensure consumer has SQS permissions
4. Check queue has messages (CloudWatch metrics)

### Duplicate Processing
- Use idempotent key (bookingId) in your database
- Track processed messages in local DB
- Use message deduplication if enabled on queue

### Messages Stuck in Queue
- Check DLQ for messages that failed multiple times
- Review CloudWatch logs for errors
- Check visibility timeout settings
