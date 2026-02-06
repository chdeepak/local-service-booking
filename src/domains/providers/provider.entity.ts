import { ID } from '../../shared/types';

export interface Provider {
  id: ID;
  name: string;
  serviceTypes?: string[];
}
