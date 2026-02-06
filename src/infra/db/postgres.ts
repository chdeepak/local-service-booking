import { Pool } from 'pg';
import { getConnectionString } from '../../config/db.js';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = getConnectionString();
    pool = new Pool({ connectionString });
    
    pool.on('error', (err) => {
      console.error('[ERROR] Postgres pool error:', err);
    });
  }
  return pool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
