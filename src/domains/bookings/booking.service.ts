import { BookingRepository } from './booking.repository.js';
import { getPool } from '../../infra/db/postgres.js';
import { Booking } from './booking.entity.js';
import { publishBookingRequestEvent, publishBookingConfirmationEvent, BookingRequestEvent, BookingConfirmationEvent } from '../../infra/messaging/sqs-client.js';

export class BookingService {
  private sqsRequestQueueUrl = process.env.SQS_BOOKING_REQUEST_QUEUE_URL || '';
  private sqsConfirmationQueueUrl = process.env.SQS_BOOKING_CONFIRMATION_QUEUE_URL || '';

  constructor(private repo = new BookingRepository()) {}

  async getAllBookings() {
    return this.repo.findAll();
  }

  async reserveSlot(slotId: string, userId: string): Promise<Booking> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Lock and fetch slot details (FOR UPDATE ensures row-level lock)
      const slot = await this.repo.getSlotDetails(slotId, client);

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.isBooked) {
        throw new Error('Slot is already booked');
      }

      // Mark slot as booked
      const updated = await this.repo.markSlotAsBooked(slotId, client);
      if (!updated) {
        throw new Error('Failed to reserve slot');
      }

      // Create booking record
      const booking = await this.repo.createBooking(
        userId,
        slot.providerId,
        slotId,
        slot.slotStart,
        slot.slotEnd,
        client
      );

      // Commit transaction
      await client.query('COMMIT');

      // Publish booking request event to SQS (asynchronously, don't block the response)
      this.publishBookingRequestEvent(booking).catch(error => {
        console.error('[WARNING] Failed to publish booking request event:', error);
      });

      return booking;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async acceptBooking(bookingId: string, providerId: string): Promise<Booking> {
    // Verify booking exists and belongs to this provider
    const booking = await this.repo.findByIdAndProviderId(bookingId, providerId);

    if (!booking) {
      throw new Error('Booking not found or does not belong to this provider');
    }

    if (booking.status !== 'pending') {
      throw new Error(`Cannot accept booking with status: ${booking.status}`);
    }

    // Update booking status to confirmed
    const updatedBooking = await this.repo.updateBookingStatus(bookingId, 'confirmed');

    if (!updatedBooking) {
      throw new Error('Failed to update booking status');
    }

    // Publish booking confirmation event to SQS (asynchronously)
    this.publishBookingConfirmationEvent(updatedBooking).catch(error => {
      console.error('[WARNING] Failed to publish booking confirmation event:', error);
    });

    return updatedBooking;
  }

  async rejectBooking(bookingId: string, providerId: string): Promise<Booking> {
    // Verify booking exists and belongs to this provider
    const booking = await this.repo.findByIdAndProviderId(bookingId, providerId);

    if (!booking) {
      throw new Error('Booking not found or does not belong to this provider');
    }

    if (booking.status !== 'pending') {
      throw new Error(`Cannot reject booking with status: ${booking.status}`);
    }

    // Update booking status to rejected
    const updatedBooking = await this.repo.updateBookingStatus(bookingId, 'rejected');

    if (!updatedBooking) {
      throw new Error('Failed to update booking status');
    }

    return updatedBooking;
  }

  private async publishBookingRequestEvent(booking: Booking): Promise<void> {
    if (!this.sqsRequestQueueUrl) {
      console.warn('[WARNING] SQS_BOOKING_REQUEST_QUEUE_URL not configured');
      return;
    }

    const event: BookingRequestEvent = {
      bookingId: booking.id,
      userId: booking.userId,
      providerId: booking.providerId,
      slotId: booking.slotId,
      slotStart: booking.start,
      slotEnd: booking.end,
      eventType: 'BOOKING_CREATED',
      timestamp: new Date().toISOString(),
    };

    await publishBookingRequestEvent(event, this.sqsRequestQueueUrl);
  }

  private async publishBookingConfirmationEvent(booking: Booking): Promise<void> {
    if (!this.sqsConfirmationQueueUrl) {
      console.warn('[WARNING] SQS_BOOKING_CONFIRMATION_QUEUE_URL not configured');
      return;
    }

    const event: BookingConfirmationEvent = {
      bookingId: booking.id,
      providerId: booking.providerId,
      acceptedAt: new Date().toISOString(),
      eventType: 'BOOKING_CONFIRMED',
      timestamp: new Date().toISOString(),
    };

    await publishBookingConfirmationEvent(event, this.sqsConfirmationQueueUrl);
  }
}
