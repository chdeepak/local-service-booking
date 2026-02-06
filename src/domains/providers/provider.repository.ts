import { pool } from '../../config/db.js';
import { Provider } from './provider.entity.js';

export class ProviderRepository {
  async findAll(): Promise<Provider[]> {
    const result = await pool.query('SELECT id, name FROM providers ORDER BY name ASC');
    return result.rows.map((row: { id: string; name: string }) => ({
      id: row.id,
      name: row.name,
    }));
  }

  async findById(id: string): Promise<Provider | null> {
    const result = await pool.query('SELECT id, name FROM providers WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0] as { id: string; name: string };
    return {
      id: row.id,
      name: row.name,
    };
  }

  async create(provider: Omit<Provider, 'id'>): Promise<Provider> {
    const result = await pool.query(
      'INSERT INTO providers (name) VALUES ($1) RETURNING id, name',
      [provider.name],
    );
    const row = result.rows[0] as { id: string; name: string };
    return { id: row.id, name: row.name };
  }

  async update(id: string, provider: Partial<Provider>): Promise<Provider | null> {
    if (provider.name === undefined) return this.findById(id);

    const result = await pool.query(
      'UPDATE providers SET name = $1 WHERE id = $2 RETURNING id, name',
      [provider.name, id],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0] as { id: string; name: string };
    return { id: row.id, name: row.name };
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM providers WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
