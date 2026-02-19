import { Slot } from './slot.entity.js';

export class SlotRepository {
  async findByProvider(providerId: string): Promise<Slot[]> {
    return [];
  }
}
