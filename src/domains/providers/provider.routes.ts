import { Router } from 'express';
import { ProviderService } from './provider.service.js';
import { logger } from '../../shared/logger.js';

const router = Router();
const providerService = new ProviderService();

// GET /providers - Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = await providerService.getAll();
    res.json(providers);
  } catch (error) {
    // Log the full error with stack so we can diagnose issues like missing tables or connection problems
    logger.error('GET /providers failed', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

export const providerRoutes = router;
