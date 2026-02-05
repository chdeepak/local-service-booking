import { ID, ISODate } from '../../shared/types';

export interface Slot {
  id: ID;
  providerId: ID;
  start: ISODate;
  end: ISODate;
  available: boolean;
}
