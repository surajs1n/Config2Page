import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';
import { User, validateUser } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Check if any users exist
const checkFirstUser = async (): Promise<boolean> => {
  interface CountResult {
    count: string | number;
  }
  const users = await executeQuery<CountResult>('SELECT COUNT(*) as count FROM users');
  return users.length === 0 || parseInt(users[0].count.toString()) === 0;
};

// First-time admin setup
router.post('/init-admin', async (req, res) => {
  try {
    const isFirstUser = await checkFirstUser();
    if (!isFirstUser) {
      return res.status(403).json({ message: 'Admin already exists' });
    }

    const { first_name, last_name, email, password } = req.body;
    const user: Partial<User> = {
      first_name,
      last_name,
      email,
      password,
      role: 'admin'
    };

    // Validate user input
    const validation = validateUser(user);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const query = `
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email, role
    `;
    const values = [first_name, last_name, email, hashedPassword, 'admin'];
    const result = await executeQuery<Partial<User>>(query, values);
    const newUser = result[0];

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
    const query = 'SELECT * FROM users WHERE email = $1';
    const users = await executeQuery<User>(query, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];

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
