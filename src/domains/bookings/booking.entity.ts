import { ID, ISODate } from '../../shared/types.js';

export interface Booking {
  id: ID;
  userId: ID;
  providerId: ID;
  slotId: ID;
  start: ISODate;
  end: ISODate;
  status: string;
}
