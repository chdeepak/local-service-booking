import { Router } from 'express';
import { UserService } from './user.service.js';

const router = Router();
const userService = new UserService();

// GET /users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/:id - Get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users - Create user
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }
    const user = await userService.create(name, email, phone);
    res.status(201).json(user);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }
    const user = await userService.update(req.params.id, name, email, phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await userService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export const userRoutes = router;
