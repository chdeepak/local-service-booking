import { BookingRepository } from './booking.repository';

export class BookingService {
  constructor(private repo = new BookingRepository()) {}
  async reserveSlot(slotId: string, userId: string) {}
}
