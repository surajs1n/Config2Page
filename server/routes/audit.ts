import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Get audit logs (admin only)
router.get('/logs', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { from, to, action_type, page = '1', limit = '20' } = req.query;
    
    // Build filters
    const filters: any = {};
    if (action_type) filters.action_type = action_type as string;
    if (from || to) {
      filters.created_at = {};
      if (from) filters.created_at.gte = new Date(from as string);
      if (to) filters.created_at.lte = new Date(to as string);
    }
    
    // Parse pagination params
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    // Query with pagination
    const logs = await prisma.auditLog.findMany({
      where: filters,
      include: {
        actor: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        target: {
          select: { id: true, first_name: true, last_name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    });
    
    // Get total count for pagination
    const total = await prisma.auditLog.count({ where: filters });
    
    res.json({
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

export default router;
