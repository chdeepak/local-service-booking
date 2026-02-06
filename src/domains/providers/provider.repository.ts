import { pool } from '../../config/db.js';
import { Provider } from './provider.entity.js';

export class ProviderRepository {
  async findAll(): Promise<Provider[]> {
    try {
      const result = await pool.query('SELECT id, name, "serviceTypes" FROM providers');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        serviceTypes: row.serviceTypes || [],
      }));
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Provider | null> {
    try {
      const result = await pool.query('SELECT id, name, "serviceTypes" FROM providers WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        serviceTypes: row.serviceTypes || [],
      };
    } catch (error) {
      console.error('Error fetching provider:', error);
      throw error;
    }
  }

  async create(provider: Omit<Provider, 'id'>): Promise<Provider> {
    try {
      const result = await pool.query(
        'INSERT INTO providers (name, "serviceTypes") VALUES ($1, $2) RETURNING id, name, "serviceTypes"',
        [provider.name, provider.serviceTypes || []]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        serviceTypes: row.serviceTypes || [],
      };
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  async update(id: string, provider: Partial<Provider>): Promise<Provider | null> {
    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (provider.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(provider.name);
      }
      if (provider.serviceTypes !== undefined) {
        updates.push(`"serviceTypes" = $${paramCount++}`);
        values.push(provider.serviceTypes);
      }

      if (updates.length === 0) return this.findById(id);

      values.push(id);
      const query = `UPDATE providers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, "serviceTypes"`;

      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        serviceTypes: row.serviceTypes || [],
      };
    } catch (error) {
      console.error('Error updating provider:', error);
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
