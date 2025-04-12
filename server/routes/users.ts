import express from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../config/database.js';
import { User, validateUser } from '../models/User.js';
import { authenticate, authorize, checkUserPermissions } from '../middleware/auth.js';

const router = express.Router();

// Create new user (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin can create users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    const { first_name, last_name, email, role, password } = req.body;
    const user: Partial<User> = {
      first_name,
      last_name,
      email,
      role,
      password,
    };

    // Validate user input
    const validation = validateUser(user);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const query = `
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email, role, created_at, updated_at
    `;
    const values = [first_name, last_name, email, hashedPassword, role];
    const result = await executeQuery<Omit<User, 'password'>>(query, values);

    res.status(201).json({
      message: 'User created successfully',
      user: result[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Get all users (accessible by all authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const query = 'SELECT id, first_name, last_name, email, role, created_at, updated_at FROM users';
    const users = await executeQuery<Omit<User, 'password'>>(query);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get single user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT id, first_name, last_name, email, role, created_at, updated_at FROM users WHERE id = $1';
    const users = await executeQuery<Omit<User, 'password'>>(query, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has permission to view this user's details
    if (req.user?.role === 'user' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user
router.put('/:id', authenticate, checkUserPermissions, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role, password } = req.body;

    // Check if user exists
    const existingUsers = await executeQuery<User>('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingUser = existingUsers[0];

    // Build update data
    const updates: Partial<User> = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (email) updates.email = email;

    // Only admin and moderators can change roles
    if (role && (req.user?.role === 'admin' || (req.user?.role === 'moderator' && existingUser.role === 'user'))) {
      updates.role = role;
    }

    // Validate updates
    const validation = validateUser(updates);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Handle password update if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Build update query
    const updateFields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE users 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING id, first_name, last_name, email, role, created_at, updated_at
    `;

    const values = [id, ...Object.values(updates)];
    const result = await executeQuery<Omit<User, 'password'>>(query, values);

    res.json({
      message: 'User updated successfully',
      user: result[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/:id', authenticate, checkUserPermissions, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const users = await executeQuery<User>('SELECT * FROM users WHERE id = $1', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await executeQuery('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;
