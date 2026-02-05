import { Slot } from './slot.entity';

export class SlotRepository {
  async findByProvider(providerId: string): Promise<Slot[]> {
    return [];
  }
}
