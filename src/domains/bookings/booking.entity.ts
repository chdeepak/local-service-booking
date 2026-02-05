import { ID, ISODate } from '../../shared/types';

export interface Booking {
  id: ID;
  slotId: ID;
  userId: ID;
  start: ISODate;
  end: ISODate;
}
