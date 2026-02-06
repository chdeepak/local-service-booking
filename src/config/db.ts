import { Pool } from 'pg';

function firstEnv(...names: Array<string>): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) return value;
  }
  return undefined;
}

function requiredEnv(...names: Array<string>): string {
  const value = firstEnv(...names);
  if (value) return value;
  throw new Error(
    `Missing required database env var. Provide one of: ${names.join(', ')}`,
  );
}

const connectionString = firstEnv('DATABASE_URL');

const dbConfig = connectionString
  ? {
      connectionString,
      // Many hosted Postgres providers require TLS. Enable via secret/env when needed.
      ssl:
        firstEnv('DB_SSL', 'PGSSLMODE') === 'true' ||
        firstEnv('PGSSLMODE') === 'require'
          ? { rejectUnauthorized: false }
          : undefined,
    }
  : {
      // Support both app-specific (`DB_*`) and common Postgres (`PG*`) env vars.
      user: requiredEnv('DB_USER', 'PGUSER'),
      password: requiredEnv('DB_PASSWORD', 'PGPASSWORD'),
      host: requiredEnv('DB_HOST', 'PGHOST'),
      port: Number.parseInt(firstEnv('DB_PORT', 'PGPORT') ?? '5432', 10),
      database: requiredEnv('DB_NAME', 'PGDATABASE'),
    };

export const pool = new Pool(dbConfig);

// Optional connection test (disable in CI/build steps unless explicitly enabled)
if (process.env.DB_TEST_CONNECTION === 'true') {
  (async () => {
    try {
      const client = await pool.connect();
      console.log('✓ Connected to PostgreSQL database');
      client.release();
    } catch (err) {
      console.error('Error connecting to database:', err);
    }
  })();
}
