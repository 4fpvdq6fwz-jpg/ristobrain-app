import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { config } from '../config';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await queryOne<any>(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get workspace membership
    const membership = await queryOne<any>(
      `SELECT wu.workspace_id, wu.role, w.name as workspace_name, w.slug
       FROM workspace_users wu
       JOIN workspaces w ON w.id = wu.workspace_id
       WHERE wu.user_id = $1
       ORDER BY wu.created_at ASC
       LIMIT 1`,
      [user.id]
    );

    if (!membership) {
      return res.status(403).json({ error: 'No active workspace found' });
    }

    const payload = {
      userId: user.id,
      workspaceId: membership.workspace_id,
      role: membership.role,
      email: user.email,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      workspace: {
        id: membership.workspace_id,
        name: membership.workspace_name,
        slug: membership.slug,
        role: membership.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await queryOne<any>(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user, workspaceId: req.user!.workspaceId, role: req.user!.role });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, workspaceName } = req.body;
    if (!email || !password || !fullName || !workspaceName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const workspaceId = uuidv4();
    const slug = workspaceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await query(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
      [userId, email.toLowerCase(), passwordHash, fullName]
    );

    await query(
      'INSERT INTO workspaces (id, name, slug, plan) VALUES ($1, $2, $3, $4)',
      [workspaceId, workspaceName, slug + '-' + userId.slice(0, 8), 'free']
    );

    await query(
      'INSERT INTO workspace_users (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceId, userId, 'owner']
    );

    const payload = { userId, workspaceId, role: 'owner', email: email.toLowerCase() };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

    return res.status(201).json({
      token,
      user: { id: userId, email, fullName },
      workspace: { id: workspaceId, name: workspaceName, slug, role: 'owner' },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /auth/password
router.put('/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await queryOne<any>('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.userId]);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
