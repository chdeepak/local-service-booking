import { Pool } from 'pg';
import { dbConfig } from '../../config/db.js';
import { logger } from '../../shared/logger.js';

const pool = new Pool({
  connectionString: dbConfig.connectionString,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : undefined,
});

export const connectPostgres = async () => {
  try {
    // Log masked connection info to make debugging easier (no password printed)
    try {
      const u = new URL(dbConfig.connectionString);
      logger.info('Connecting to Postgres at', `${u.hostname}:${u.port || '5432'}`);
    } catch (e) {
      // ignore parsing errors
    }

    // simple validation query
    await pool.query('SELECT 1');
    logger.info('Connected to Postgres');
    return pool;
  } catch (err) {
    logger.error('Postgres connection error', err as Error);
    throw err;
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
