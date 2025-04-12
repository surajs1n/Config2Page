import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Check if any users exist
const checkFirstUser = async (): Promise<boolean> => {
  const count = await prisma.user.count();
  return count === 0;
};

// First-time admin setup
router.post('/init-admin', async (req, res) => {
  try {
    const isFirstUser = await checkFirstUser();
    if (!isFirstUser) {
      return res.status(403).json({ message: 'Admin already exists' });
    }

    const { first_name, last_name, email, password } = req.body;
    
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

    // Create admin user
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role: 'admin'
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Error creating admin user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Check if this is first-time setup (no users exist)
router.get('/check-first-user', async (req, res) => {
  try {
    const isFirstUser = await checkFirstUser();
    res.json({ isFirstUser });
  } catch (error) {
    console.error('Error checking first user:', error);
    res.status(500).json({ message: 'Error checking first user status' });
  }
});

// Get current session
router.get('/session', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { password: _, ...userWithoutPassword } = req.user;
  res.json({
    user: userWithoutPassword
  });
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
