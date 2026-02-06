import { Pool } from 'pg';
import { getConnectionString } from '../../config/db.js';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = getConnectionString();
    const config: any = { connectionString };
    
    // Handle SSL for RDS databases
    if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('rds')) {
      config.ssl = { rejectUnauthorized: false };
    }
    
    pool = new Pool(config);

    pool.on('error', (err: Error) => {
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
