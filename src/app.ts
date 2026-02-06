import express from 'express';
import { providerRoutes } from './domains/providers/provider.routes.js';
import { bookingRoutes } from './domains/bookings/booking.routes.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use('/providers', providerRoutes);
  app.use('/bookings', bookingRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
