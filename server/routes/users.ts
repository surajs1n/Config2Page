import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
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

    // Validate email format
    if (!email?.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    
    if (password.length < minLength || !hasLowerCase || !hasUpperCase) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain both uppercase and lowercase letters'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Get all users (accessible by all authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });
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
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has permission to view this user's details
    if (req.user?.role === 'user' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
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
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update data
    const updates: any = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (email) {
      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      updates.email = email;
    }

    // Only admin and moderators can change roles
    if (role && (req.user?.role === 'admin' || (req.user?.role === 'moderator' && existingUser.role === 'user'))) {
      updates.role = role;
    }

    // Handle password update if provided
    if (password) {
      const minLength = 8;
      const hasLowerCase = /[a-z]/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      
      if (password.length < minLength || !hasLowerCase || !hasUpperCase) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long and contain both uppercase and lowercase letters'
        });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updates,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
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
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;
