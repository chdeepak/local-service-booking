import { SlotRepository } from './slot.repository.js';

export class SlotService {
  constructor(private repo = new SlotRepository()) {}
}
