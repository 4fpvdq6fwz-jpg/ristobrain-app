import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../db';
import { config } from '../config';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password obbligatori' });
    }

    const user = await queryOne<any>(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

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
      return res.status(403).json({ error: 'Nessun workspace trovato' });
    }

    // Anti-sharing: ogni login invalida le sessioni precedenti (un solo accesso attivo per account)
    const sv = await queryOne<any>(
      'UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version',
      [user.id]
    );

    const payload = {
      userId: user.id,
      workspaceId: membership.workspace_id,
      role: membership.role,
      email: user.email,
      sessionVersion: sv?.session_version ?? 0,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name },
      workspace: {
        id: membership.workspace_id,
        name: membership.workspace_name,
        slug: membership.slug,
        role: membership.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await queryOne<any>(
      'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    return res.json({ user, workspaceId: req.user!.workspaceId, role: req.user!.role });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno' });
  }
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, workspaceName } = req.body;
    if (!email || !password || !fullName || !workspaceName) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'Email già in uso' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const workspaceId = uuidv4();
    const slug = workspaceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + userId.slice(0, 8);

    await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
        [userId, email.toLowerCase(), passwordHash, fullName]
      );
      await client.query(
        'INSERT INTO workspaces (id, name, slug, plan) VALUES ($1, $2, $3, $4)',
        [workspaceId, workspaceName, slug, 'free']
      );
      await client.query(
        'INSERT INTO workspace_users (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspaceId, userId, 'owner']
      );
    });

    const payload = { userId, workspaceId, role: 'owner', email: email.toLowerCase(), sessionVersion: 0 };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

    return res.status(201).json({
      token,
      user: { id: userId, email, fullName },
      workspace: { id: workspaceId, name: workspaceName, slug, role: 'owner' },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Errore nella registrazione' });
  }
});

// PUT /auth/password
router.put('/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Entrambe le password sono obbligatorie' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nuova password deve essere di almeno 8 caratteri' });
    }

    const user = await queryOne<any>('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Password attuale non corretta' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.userId]);

    return res.json({ message: 'Password aggiornata' });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno' });
  }
});

// DELETE /auth/account — GDPR: cancella tutti i dati dell'utente
router.delete('/account', authenticate, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password obbligatoria per confermare la cancellazione' });
    }

    const user = await queryOne<any>('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Password non corretta' });

    // Soft-delete: marca utente come eliminato
    await query(
      `UPDATE users SET deleted_at = NOW(), email = $1, full_name = 'Account eliminato' WHERE id = $2`,
      ['deleted_' + req.user!.userId + '@deleted.invalid', req.user!.userId]
    );

    // Se è l'unico owner del workspace, soft-delete anche il workspace
    const otherOwners = await query<any>(
      `SELECT user_id FROM workspace_users WHERE workspace_id = $1 AND role = 'owner' AND user_id != $2`,
      [req.user!.workspaceId, req.user!.userId]
    );
    if (otherOwners.length === 0) {
      await query('UPDATE workspaces SET deleted_at = NOW() WHERE id = $1', [req.user!.workspaceId]);
    }

    return res.json({ message: 'Account eliminato con successo' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Errore nella cancellazione account' });
  }
});

// GET /auth/export — GDPR: esporta tutti i dati dell'utente
router.get('/export', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const wsId = req.user!.workspaceId;

    const [user, workspace, ingredients, recipes, menus, sales] = await Promise.all([
      queryOne<any>('SELECT id, email, full_name, created_at FROM users WHERE id = $1', [userId]),
      queryOne<any>('SELECT id, name, slug, plan, created_at FROM workspaces WHERE id = $1', [wsId]),
      query<any>('SELECT id, name, purchase_unit, created_at FROM ingredients WHERE workspace_id = $1 AND deleted_at IS NULL', [wsId]),
      query<any>('SELECT id, name, description, created_at FROM recipes WHERE workspace_id = $1 AND deleted_at IS NULL', [wsId]),
      query<any>('SELECT id, name, created_at FROM menus WHERE workspace_id = $1 AND deleted_at IS NULL', [wsId]),
      query<any>('SELECT sp.name, sp.period_from, sp.period_to, sp.total_revenue FROM sales_periods sp WHERE sp.workspace_id = $1 ORDER BY sp.period_from DESC LIMIT 50', [wsId]),
    ]);

    return res.json({
      exportDate: new Date().toISOString(),
      user,
      workspace,
      data: { ingredients, recipes, menus, sales },
    });
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Errore nell\'esportazione dati' });
  }
});

export default router;
