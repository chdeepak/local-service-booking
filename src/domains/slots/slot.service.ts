import { SlotRepository } from './slot.repository';

export class SlotService {
  constructor(private repo = new SlotRepository()) {}
}
