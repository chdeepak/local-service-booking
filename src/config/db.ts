// DB config - prefer DATABASE_URL, otherwise build from individual env vars
const defaultConnectionString = `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'booking'}`;

export const dbConfig = {
  connectionString: process.env.DATABASE_URL || defaultConnectionString,
  ssl: process.env.DB_SSL === 'true' || false,
};
