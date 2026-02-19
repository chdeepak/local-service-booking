import { Router } from 'express';
import { ProviderService } from './provider.service.js';
import { BookingService } from '../bookings/booking.service.js';

const router = Router();
const providerService = new ProviderService();
const bookingService = new BookingService();

// GET /providers - Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = await providerService.getAll();
    res.json(providers);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// GET /providers/:id - Get provider by id
router.get('/:id', async (req, res) => {
  try {
    const provider = await providerService.getById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// POST /providers - Create provider
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const provider = await providerService.create(name);
    res.status(201).json(provider);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to create provider' });
  }
});

// PUT /providers/:id - Update provider
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const provider = await providerService.update(req.params.id, name);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    console.error('[ERROR]', error);
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
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});

// POST /providers/:providerId/bookings/:bookingId/accept - Accept a booking
router.post('/:providerId/bookings/:bookingId/accept', async (req, res) => {
  try {
    const { providerId, bookingId } = req.params;

    if (!providerId || !bookingId) {
      return res.status(400).json({ error: 'providerId and bookingId are required' });
    }

    const booking = await bookingService.acceptBooking(bookingId, providerId);
    res.status(200).json({
      message: 'Booking accepted successfully',
      booking,
    });
  } catch (error: any) {
    console.error('[ERROR]', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('Cannot accept')) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to accept booking' });
  }
});

// POST /providers/:providerId/bookings/:bookingId/reject - Reject a booking
router.post('/:providerId/bookings/:bookingId/reject', async (req, res) => {
  try {
    const { providerId, bookingId } = req.params;

    if (!providerId || !bookingId) {
      return res.status(400).json({ error: 'providerId and bookingId are required' });
    }

    const booking = await bookingService.rejectBooking(bookingId, providerId);
    res.status(200).json({
      message: 'Booking rejected successfully',
      booking,
    });
  } catch (error: any) {
    console.error('[ERROR]', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('Cannot reject')) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

export const providerRoutes = router;

