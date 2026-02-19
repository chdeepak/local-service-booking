import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

let sqsClient: SQSClient | null = null;

const isFifoQueueUrl = (queueUrl: string): boolean => queueUrl.endsWith('.fifo');

const getDeduplicationId = (eventType: string, bookingId: string, timestamp: string): string =>
  `${eventType}-${bookingId}-${timestamp}`;

export const getSQSClient = (): SQSClient => {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return sqsClient;
};

export interface BookingRequestEvent {
  bookingId: string;
  userId: string;
  providerId: string;
  slotId: string;
  slotStart: string;
  slotEnd: string;
  eventType: 'BOOKING_CREATED';
  timestamp: string;
}

export interface BookingConfirmationEvent {
  bookingId: string;
  providerId: string;
  acceptedAt: string;
  eventType: 'BOOKING_CONFIRMED';
  timestamp: string;
}

export async function publishBookingRequestEvent(
  event: BookingRequestEvent,
  queueUrl: string
): Promise<string> {
  const client = getSQSClient();
  const isFifo = isFifoQueueUrl(queueUrl);
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(event),
    ...(isFifo
      ? {
          MessageGroupId: event.providerId,
          MessageDeduplicationId: getDeduplicationId(
            event.eventType,
            event.bookingId,
            event.timestamp
          ),
        }
      : {}),
    MessageAttributes: {
      EventType: {
        StringValue: 'BOOKING_CREATED',
        DataType: 'String',
      },
      BookingId: {
        StringValue: event.bookingId,
        DataType: 'String',
      },
      ProviderId: {
        StringValue: event.providerId,
        DataType: 'String',
      },
    },
  });

  try {
    const response = await client.send(command);
    const messageId = response.MessageId;
    console.log(`[SQS] Published booking request event: ${messageId}`);
    return messageId || '';
  } catch (error) {
    console.error('[SQS ERROR] Failed to publish booking request event:', error);
    throw error;
  }
}

export async function publishBookingConfirmationEvent(
  event: BookingConfirmationEvent,
  queueUrl: string
): Promise<string> {
  const client = getSQSClient();
  const isFifo = isFifoQueueUrl(queueUrl);
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(event),
    ...(isFifo
      ? {
          MessageGroupId: event.providerId,
          MessageDeduplicationId: getDeduplicationId(
            event.eventType,
            event.bookingId,
            event.timestamp
          ),
        }
      : {}),
    MessageAttributes: {
      EventType: {
        StringValue: 'BOOKING_CONFIRMED',
        DataType: 'String',
      },
      BookingId: {
        StringValue: event.bookingId,
        DataType: 'String',
      },
      ProviderId: {
        StringValue: event.providerId,
        DataType: 'String',
      },
    },
  });

  try {
    const response = await client.send(command);
    const messageId = response.MessageId;
    console.log(`[SQS] Published booking confirmation event: ${messageId}`);
    return messageId || '';
  } catch (error) {
    console.error('[SQS ERROR] Failed to publish booking confirmation event:', error);
    throw error;
  }
}
