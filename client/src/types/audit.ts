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
