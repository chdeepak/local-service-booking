import { Pool } from 'pg';
import { dbConfig } from '../../config/db.js';
import { logger } from '../../shared/logger.js';

const pool = new Pool({
  connectionString: dbConfig.connectionString,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : undefined,
});

export const connectPostgres = async () => {
  try {
    // simple validation query
    await pool.query('SELECT 1');
    logger.info('Connected to Postgres');
    return pool;
  } catch (err) {
    logger.error('Postgres connection error', err);
    throw err;
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
