import { pool } from '../../config/db.js';
import { Provider } from './provider.entity.js';

export class ProviderRepository {
  async findAll(): Promise<Provider[]> {
    try {
      const result = await pool.query('SELECT id, name FROM providers');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name
      }));
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Provider | null> {
    try {
      const result = await pool.query('SELECT id, name  FROM providers WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name
      };
    } catch (error) {
      console.error('Error fetching provider:', error);
      throw error;
    }
  }


  async delete(id: string): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM providers WHERE id = $1', [id]);
      return result.rowCount! > 0;
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  }
}
