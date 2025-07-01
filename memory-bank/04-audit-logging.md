# Audit Logging System

## Overview

The audit logging system in Config2Page provides comprehensive tracking of user activities and system events. It maintains an immutable record of actions performed within the system, enabling accountability and compliance.

## Audit Log Model

```prisma
model AuditLog {
  id            Int      @id @default(autoincrement())
  actor_user_id Int
  action_type   String
  target_user_id Int?
  metadata      Json
  ip_address    String?  @db.VarChar(45)
  created_at    DateTime @default(now())
  
  actor         User     @relation("ActorLogs", fields: [actor_user_id], references: [id])
  target        User?    @relation("TargetLogs", fields: [target_user_id], references: [id])
  
  @@index([action_type])
  @@index([created_at])
  @@map("audit_logs")
}
```

## Tracked Events

### Authentication Events
1. **Login Success**
   - Actor: The user who logged in
   - Metadata: Browser user agent
   - IP Address: Client IP

2. **Login Failure**
   - Actor: System (0 for unknown user)
   - Metadata: Failure reason, attempted email
   - IP Address: Client IP

3. **Logout**
   - Actor: The user who logged out
   - IP Address: Client IP

### User Management Events
1. **User Creation**
   - Actor: Admin who created the user
   - Target: Newly created user
   - Metadata: Email and role of new user
   - IP Address: Admin's IP

2. **User Updates**
   - Actor: User who made the changes
   - Target: User being updated
   - Metadata: Field-by-field changes
   - IP Address: Actor's IP

3. **User Deletion**
   - Actor: User who performed deletion
   - Target: Deleted user
   - Metadata: Email and role of deleted user
   - IP Address: Actor's IP

## Implementation

### Audit Service

```typescript
// services/auditService.ts

// Audit action types
export const AUDIT_TYPES = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  
  // User Management
  CREATE_USER: 'CREATE_USER',
  EDIT_USER: 'EDIT_USER',
  DELETE_USER: 'DELETE_USER',
} as const;

type AuditActionType = typeof AUDIT_TYPES[keyof typeof AUDIT_TYPES];

// Log user action
export const logUserAction = async (
  actorId: number,
  actionType: AuditActionType,
  targetId?: number,
  metadata?: any,
  ipAddress?: string
) => {
  return prisma.auditLog.create({
    data: {
      actor_user_id: actorId,
      action_type: actionType,
      target_user_id: targetId,
      metadata: metadata || {},
      ip_address: ipAddress
    }
  });
};

// Helper for logging user edits
export const logUserEdit = async (
  actorId: number,
  targetId: number,
  oldData: any,
  newData: any,
  ipAddress?: string
) => {
  const changes: Array<{field: string; oldValue: any; newValue: any}> = [];
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changes.push({
        field: key,
        oldValue: oldData[key],
        newValue: newData[key]
      });
    }
  }
  
  if (changes.length > 0) {
    return logUserAction(
      actorId,
      AUDIT_TYPES.EDIT_USER,
      targetId,
      { changes },
      ipAddress
    );
  }
};
```

### IP Address Capture

```typescript
// middleware/ipCapture.ts
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
```

### Audit Log API

```typescript
// routes/audit.ts
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
```

## Frontend Implementation

### Audit Log Types

```typescript
// types/audit.ts
import { User } from '../context/AuthContext';

export interface AuditLog {
  id: number;
  action_type: string;
  actor_user_id: number;
  target_user_id?: number;
  metadata: any;
  ip_address?: string;
  created_at: string;
  actor: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
  target?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
}

export interface AuditPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditResponse {
  logs: AuditLog[];
  pagination: AuditPagination;
}

export const AUDIT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CREATE_USER: 'CREATE_USER',
  EDIT_USER: 'EDIT_USER',
  DELETE_USER: 'DELETE_USER',
} as const;

export type AuditActionType = typeof AUDIT_TYPES[keyof typeof AUDIT_TYPES];
```

### Audit Log Page

The Audit Log page provides a comprehensive view of system activities with filtering and pagination:

- Date range filtering
- Action type filtering
- Sortable columns
- Pagination controls
- Detailed metadata display
- Color-coded action types

Key features of the implementation:

1. **Filtering**
   ```typescript
   const [filters, setFilters] = useState({
     from: '',
     to: '',
     action_type: ''
   });
   ```

2. **Pagination**
   ```typescript
   const [pagination, setPagination] = useState<AuditPagination>({
     page: 1,
     limit: 20,
     total: 0,
     pages: 0
   });
   ```

3. **Metadata Formatting**
   ```typescript
   const formatMetadata = (metadata: any): string => {
     if (!metadata) return 'No details';
     
     if (metadata.changes) {
       return metadata.changes.map((change: any) => (
         `${change.field}: ${change.oldValue} → ${change.newValue}`
       )).join(', ');
     }
     
     if (metadata.reason) {
       return `Reason: ${metadata.reason}`;
     }
     
     if (metadata.user_details) {
       return `User: ${metadata.user_details.email} (${metadata.user_details.role})`;
     }
     
     if (metadata.browser) {
       return `Browser: ${metadata.browser}`;
     }
     
     return JSON.stringify(metadata);
   };
   ```

4. **Action Type Styling**
   ```typescript
   const getActionTypeColor = (actionType: string): string => {
     switch (actionType) {
       case AUDIT_TYPES.LOGIN_SUCCESS:
         return 'bg-green-100 text-green-800';
       case AUDIT_TYPES.LOGIN_FAILURE:
         return 'bg-red-100 text-red-800';
       case AUDIT_TYPES.CREATE_USER:
         return 'bg-blue-100 text-blue-800';
       case AUDIT_TYPES.EDIT_USER:
         return 'bg-yellow-100 text-yellow-800';
       case AUDIT_TYPES.DELETE_USER:
         return 'bg-purple-100 text-purple-800';
       default:
         return 'bg-gray-100 text-gray-800';
     }
   };
   ```

## Security Considerations

1. **Access Control**
   - Only administrators can access audit logs
   - Audit log entries are immutable
   - No delete or update operations are provided

2. **Data Protection**
   - Sensitive data is filtered from logs
   - Password changes are logged without the actual passwords
   - IP addresses are stored for security analysis

3. **Performance**
   - Indexes on action_type and created_at
   - Pagination to handle large datasets
   - Efficient querying with proper joins

## Best Practices

1. **Logging**
   - Log all security-relevant events
   - Include sufficient context in metadata
   - Use consistent action types
   - Capture IP addresses for security

2. **Data Management**
   - Regular archiving of old logs
   - Backup strategy for audit data
   - Data retention policy compliance

3. **UI/UX**
   - Clear and intuitive filtering
   - Meaningful action type colors
   - Detailed but readable metadata
   - Efficient pagination controls

## Future Enhancements

1. **Advanced Filtering**
   - Filter by IP address
   - Filter by user (actor/target)
   - Full-text search in metadata

2. **Export Capabilities**
   - CSV export
   - PDF reports
   - Custom date ranges

3. **Analytics**
   - Login failure patterns
   - User activity trends
   - Security incident detection

4. **Performance Optimizations**
   - Caching frequently accessed logs
   - Archiving old records
   - Optimized queries for large datasets
