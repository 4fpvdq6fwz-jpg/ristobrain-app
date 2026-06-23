import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types';
import { queryOne } from '../db';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  let payload: AuthUser;
  try {
    payload = jwt.verify(token, config.jwtSecret) as AuthUser;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  try {
    // Anti-sharing: la sessione e valida solo se la session_version del token combacia con quella nel DB.
    // Un nuovo login incrementa session_version e invalida tutte le sessioni precedenti.
    const row = await queryOne<{ session_version: number }>(
      'SELECT session_version FROM users WHERE id = $1 AND deleted_at IS NULL',
      [payload.userId]
    );
    if (!row || (payload.sessionVersion ?? -1) !== row.session_version) {
      res.status(401).json({ error: 'Sessione non valida: questo account e stato usato su un altro dispositivo' });
      return;
    }
    req.user = payload;
    next();
  } catch (err) {
    console.error('Auth session check error:', err);
    res.status(500).json({ error: 'Errore interno' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
