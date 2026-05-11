export type UserRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'consultant' | 'viewer';

export interface AuthUser {
  userId: string;
  workspaceId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
