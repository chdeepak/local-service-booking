import { Pool } from 'pg';
import { getConnectionString } from '../../config/db.js';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = getConnectionString();
    // Always disable SSL cert verification for RDS and self-signed certificates
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false,
          ca: fs.readFileSync('/etc/ssl/rds/global-bundle.pem').toString()
 } : false,
    });

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
