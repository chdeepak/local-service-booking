import { Provider } from './provider.entity.js';
import { getPool } from '../../infra/db/postgres.js';

export class ProviderRepository {
  async findAll(): Promise<Provider[]> {
    const pool = getPool();
    const result = await pool.query('SELECT id, name FROM providers ORDER BY id');
    return result.rows as Provider[];
  }

  async findById(id: string): Promise<Provider | null> {
    const pool = getPool();
    const result = await pool.query('SELECT id, name FROM providers WHERE id = $1', [id]);
    return (result.rows[0] as Provider) || null;
  }

  async create(name: string): Promise<Provider> {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO providers(name) VALUES($1) RETURNING id, name',
      [name]
    );
    return result.rows[0] as Provider;
  }

  async update(id: string, name: string): Promise<Provider | null> {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE providers SET name = $1 WHERE id = $2 RETURNING id, name',
      [name, id]
    );
    return (result.rows[0] as Provider) || null;
  }

  async delete(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query('DELETE FROM providers WHERE id = $1', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
