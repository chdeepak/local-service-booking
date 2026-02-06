import express from 'express';
import { providerRoutes } from './domains/providers/provider.routes.js';
import { bookingRoutes } from './domains/bookings/booking.routes.js';
import { query } from './infra/db/postgres.js';
import { logger } from './shared/logger.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use('/providers', providerRoutes);
  app.use('/bookings', bookingRoutes);

  // Health check endpoint (also verifies DB connectivity)
  app.get('/health', async (req, res) => {
    try {
      await query('SELECT 1');
      res.json({ status: 'ok', db: 'ok' });
    } catch (err) {
      logger.error('Health check DB query failed', err);
      res.status(500).json({ status: 'ok', db: 'down' });
    }
  });

  return app;
} 
