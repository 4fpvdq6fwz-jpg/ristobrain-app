import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { query, queryOne } from '../db';
import { config } from '../config';

const router = Router();

function isMaster(req: Request): boolean {
  return config.masterEmails.includes((req.user!.email || '').toLowerCase());
}

// POST /api/admin/set-plan — master: assegna un piano a un workspace senza pagamento
// body: { email?: string, userId?: string, plan: 'free'|'base'|'pro'|'business' }
router.post('/set-plan', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isMaster(req)) return res.status(403).json({ error: 'Accesso riservato' });
    const { userId, email, plan } = req.body || {};
    const valid = ['free', 'base', 'pro', 'business'];
    if (!valid.includes(plan)) return res.status(400).json({ error: 'plan non valido (free/base/pro/business)' });
    if (!userId && !email) return res.status(400).json({ error: 'userId o email obbligatori' });

    let uId = userId;
    if (!uId && email) {
      const u = await queryOne<any>('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [String(email).toLowerCase()]);
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      uId = u.id;
    }

    const row = await queryOne<any>(
      `SELECT wu.workspace_id FROM workspace_users wu WHERE wu.user_id = $1 ORDER BY wu.created_at ASC LIMIT 1`,
      [uId]
    );
    if (!row) return res.status(404).json({ error: 'Workspace non trovato per questo utente' });

    await query(`UPDATE workspaces SET plan = $1 WHERE id = $2`, [plan, row.workspace_id]);
    return res.json({ message: `Piano impostato a ${plan}`, workspaceId: row.workspace_id, plan });
  } catch (err) {
    console.error('Admin set-plan error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
