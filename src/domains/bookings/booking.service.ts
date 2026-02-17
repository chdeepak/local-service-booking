import { BookingRepository } from './booking.repository.js';
import { getPool } from '../../infra/db/postgres.js';
import { Booking } from './booking.entity.js';

export class BookingService {
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

      return booking;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
