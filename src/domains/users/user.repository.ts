import { User } from './user.entity.js';
import { getPool } from '../../infra/db/postgres.js';

export class UserRepository {
  async findAll(): Promise<User[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, email, phone FROM users ORDER BY id'
    );
    return result.rows as User[];
  }

  async findById(id: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE id = $1',
      [id]
    );
    return (result.rows[0] as User) || null;
  }

  async create(name: string, email: string, phone: string): Promise<User> {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO users(name, email, phone) VALUES($1, $2, $3) RETURNING id, name, email, phone',
      [name, email, phone]
    );
    return result.rows[0] as User;
  }

  async update(id: string, name: string, email: string, phone: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone',
      [name, email, phone, id]
    );
    return (result.rows[0] as User) || null;
  }

  async delete(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
