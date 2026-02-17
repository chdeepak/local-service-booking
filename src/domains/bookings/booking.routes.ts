import { Router } from 'express';
import { BookingService } from './booking.service.js';

const router = Router();
const bookingService = new BookingService();

// POST /bookings - Create a booking
router.post('/', async (req, res) => {
  try {
    const { slotId, userId } = req.body;

    if (!slotId || !userId) {
      return res.status(400).json({ error: 'slotId and userId are required' });
    }

    const booking = await bookingService.reserveSlot(slotId, userId);
    res.status(201).json(booking);
  } catch (error: any) {
    console.error('[ERROR]', error);
    
    if (error.message === 'Slot not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Slot is already booked') {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export const bookingRoutes = router;
