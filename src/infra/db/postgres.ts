import { Pool } from 'pg';
import { getConnectionString } from '../../config/db.js';
import fs from 'fs';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = getConnectionString();
    // Always disable SSL cert verification for RDS and self-signed certificates
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
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
