import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

// Define User type based on Prisma schema
type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: Date;
  updated_at: Date;
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// JWT token interface
interface JwtPayload {
  userId: number;
  role: string;
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JwtPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request object
    req.user = user as User;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const authorize = (allowedRoles: ('admin' | 'moderator' | 'user')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

// Permission checking middleware for user operations
export const checkUserPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user } = req;
  const targetUserId = parseInt(req.params.id);

  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admin can edit/delete all users except self-deletion
  if (user.role === 'admin') {
    if (req.method === 'DELETE' && user.id === targetUserId) {
      return res.status(403).json({ message: 'Admins cannot delete their own account' });
    }
    return next();
  }

  // Moderator can edit basic users and their own details
  if (user.role === 'moderator') {
    if (req.method === 'DELETE') {
      // Check if target user is a basic user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (targetUser.role !== 'user') {
        return res.status(403).json({ message: 'Moderators can only delete basic users' });
      }
      
      return next();
    }
    
    if (user.id === targetUserId) {
      return next();
    }
  }

  // Basic users can only edit their own details
  if (user.role === 'user') {
    if (user.id !== targetUserId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.method === 'DELETE') {
      return res.status(403).json({ message: 'Basic users cannot delete accounts' });
    }
    return next();
  }

  return res.status(403).json({ message: 'Access denied' });
};
