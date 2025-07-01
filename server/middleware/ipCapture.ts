import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include clientIp
declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
    }
  }
}

export const captureIp = (req: Request, res: Response, next: NextFunction) => {
  // Get IP from X-Forwarded-For header or socket
  req.clientIp = (
    req.headers['x-forwarded-for']?.toString() ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim(); // Get first IP if multiple are present
  
  next();
};
