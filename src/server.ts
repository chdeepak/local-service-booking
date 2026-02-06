import express from 'express';
import { createApp } from './app.js';
import { connectPostgres } from './infra/db/postgres.js';
import { logger } from './shared/logger.js';

const PORT = process.env.PORT || 3000;

export async function startServer() {
  // Validate DB connectivity before starting the server so issues are visible immediately
  try {
    await connectPostgres();
  } catch (err) {
    logger.error('Database connection failed at startup', err);
    throw err;
  }

  const app = createApp();
  
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
} 
