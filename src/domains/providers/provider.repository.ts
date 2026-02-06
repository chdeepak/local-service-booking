import { Provider } from './provider.entity';
import { query } from '../../infra/db/postgres.js';
import { logger } from '../../shared/logger.js';

export class ProviderRepository {
  async findAll(): Promise<Provider[]> {
    try {
      const res = await query('SELECT id, name FROM providers');
      return res.rows.map((r: any) => ({ id: r.id, name: r.name }));
    } catch (err) {
      logger.error('Error fetching providers', err);
      throw err;
    }
  }
} 
