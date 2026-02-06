import fs from 'fs';
import path from 'path';

// Load optional local JSON config at config/db.local.json (keep secrets out of repo)
const localConfigPath = path.join(process.cwd(), 'config', 'db.local.json');
let localConfig: Record<string, any> = {};
try {
  if (fs.existsSync(localConfigPath)) {
    const raw = fs.readFileSync(localConfigPath, 'utf8');
    localConfig = JSON.parse(raw);
    console.info('[INFO] Loaded DB config from', localConfigPath);
  }
} catch (err) {
  console.error('[ERROR] Failed to load local DB config', err);
}

const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? localConfig.DATABASE_URL,
  DB_HOST: process.env.DB_HOST ?? localConfig.DB_HOST,
  DB_USER: process.env.DB_USER ?? localConfig.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ?? localConfig.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME ?? localConfig.DB_NAME ?? 'booking',
  DB_PORT: process.env.DB_PORT ?? localConfig.DB_PORT ?? '5432',
  DB_SSL: process.env.DB_SSL ?? (localConfig.DB_SSL ? String(localConfig.DB_SSL) : undefined),
};

const defaultConnectionString = `postgres://${env.DB_USER || 'postgres'}:${env.DB_PASSWORD || ''}@${env.DB_HOST || 'localhost'}:${env.DB_PORT}/${env.DB_NAME}`;

export const dbConfig = {
  connectionString: env.DATABASE_URL || defaultConnectionString,
  ssl: String(env.DB_SSL) === 'true' || false,
};
