import { Booking } from './booking.entity.js';
import { getPool } from '../../infra/db/postgres.js';
import { PoolClient } from 'pg';

export class BookingRepository {
  async findBySlotId(slotId: string): Promise<Booking | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, user_id, provider_id, slot_id, slot_start, slot_end, status FROM bookings WHERE slot_id = $1',
      [slotId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      providerId: row.provider_id.toString(),
      slotId: row.slot_id.toString(),
      start: row.slot_start,
      end: row.slot_end,
      status: row.status,
    };
  }

  async createBooking(
    userId: string,
    providerId: string,
    slotId: string,
    slotStart: string,
    slotEnd: string,
    client?: PoolClient
  ): Promise<Booking> {
    const db = client || getPool();
    const result = await db.query(
      `INSERT INTO bookings(user_id, provider_id, slot_id, slot_start, slot_end, status)
       VALUES($1, $2, $3, $4, $5, 'confirmed')
       RETURNING id, user_id, provider_id, slot_id, slot_start, slot_end, status`,
      [userId, providerId, slotId, slotStart, slotEnd]
    );
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      providerId: row.provider_id.toString(),
      slotId: row.slot_id.toString(),
      start: row.slot_start,
      end: row.slot_end,
      status: row.status,
    };
  }

  async markSlotAsBooked(slotId: string, client?: PoolClient): Promise<boolean> {
    const db = client || getPool();
    const result = await db.query(
      'UPDATE availability SET is_booked = TRUE WHERE id = $1 AND is_booked = FALSE',
      [slotId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSlotDetails(slotId: string, client?: PoolClient): Promise<{
    id: string;
    providerId: string;
    slotStart: string;
    slotEnd: string;
    isBooked: boolean;
  } | null> {
    const db = client || getPool();
    const result = await db.query(
      'SELECT id, provider_id, slot_start, slot_end, is_booked FROM availability WHERE id = $1 FOR UPDATE',
      [slotId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      providerId: row.provider_id.toString(),
      slotStart: row.slot_start,
      slotEnd: row.slot_end,
      isBooked: row.is_booked,
    };
  }
}
