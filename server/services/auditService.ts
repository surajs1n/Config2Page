import prisma from '../config/prisma.js';

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
