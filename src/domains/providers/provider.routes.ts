import { Router } from 'express';
import { ProviderService } from './provider.service.js';

const router = Router();
const providerService = new ProviderService();

function parseName(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const name = (body as { name?: unknown }).name;
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// GET /providers - Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = await providerService.getAll();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// GET /providers/:id - Get provider by ID
router.get('/:id', async (req, res) => {
  try {
    const provider = await providerService.getById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// POST /providers - Create new provider
router.post('/', async (req, res) => {
  try {
    const name = parseName(req.body);
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const provider = await providerService.create({ name });
    res.status(201).json(provider);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create provider' });
  }
});

// PUT /providers/:id - Update provider
router.put('/:id', async (req, res) => {
  try {
    const name = parseName(req.body);
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const provider = await providerService.update(req.params.id, { name });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// DELETE /providers/:id - Delete provider
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await providerService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});

export const providerRoutes = router;
