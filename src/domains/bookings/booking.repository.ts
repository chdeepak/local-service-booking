import { Booking } from './booking.entity';

export class BookingRepository {
  async create(booking: Booking): Promise<Booking> {
    return booking;
  }
}
