import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { query, queryOne } from '../db';

const router = Router();
const MAX_MEMBERS = 5; // anti-abuso: tetto posti per workspace

function isManager(role?: string): boolean {
  return role === 'owner' || role === 'admin';
}
async function getWorkspace(wsId: string) {
  return queryOne<any>('SELECT id, plan FROM workspaces WHERE id = $1', [wsId]);
}
// GET /api/team/members
router.get('/members', authenticate, async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    const members = await query<any>(
      `SELECT u.id, u.email, u.full_name, wu.role, u.created_at
       FROM workspace_users wu JOIN users u ON u.id = wu.user_id
       WHERE wu.workspace_id = $1 AND u.deleted_at IS NULL
       ORDER BY (wu.role = 'owner') DESC, wu.created_at ASC`, [wsId]);
    const ws = await getWorkspace(wsId);
    return res.json({ plan: ws?.plan || 'free', maxMembers: MAX_MEMBERS, canManage: isManager(req.user!.role), members });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});
// POST /api/team/members (business only, owner/admin)
router.post('/members', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Solo il titolare o un amministratore puo gestire il team.' });
    const wsId = req.user!.workspaceId;
    const ws = await getWorkspace(wsId);
    if (!ws || ws.plan !== 'business') return res.status(402).json({ error: 'La gestione del team e inclusa nel piano Business. Passa a Business per aggiungere collaboratori.', upgrade: true });
    const { email, password, fullName, role: roleRaw } = req.body || {};
    if (!email || !password || !fullName) return res.status(400).json({ error: 'Email, nome e password sono obbligatori.' });
    if (String(password).length < 8) return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri.' });
    const role = roleRaw === 'admin' && req.user!.role === 'owner' ? 'admin' : 'member';
    const cnt = await queryOne<any>('SELECT COUNT(*)::int AS n FROM workspace_users WHERE workspace_id = $1', [wsId]);
    if ((cnt?.n || 0) >= MAX_MEMBERS) return res.status(400).json({ error: `Hai raggiunto il numero massimo di ${MAX_MEMBERS} account nel team.` });
    const em = String(email).toLowerCase();
    const exists = await queryOne<any>('SELECT id FROM users WHERE email = $1', [em]);
    if (exists) return res.status(409).json({ error: 'Email gia in uso.' });
    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await query('INSERT INTO users (id, email, password_hash, full_name, email_verified) VALUES ($1,$2,$3,$4,TRUE)', [userId, em, hash, fullName]);
    await query('INSERT INTO workspace_users (workspace_id, user_id, role) VALUES ($1,$2,$3)', [wsId, userId, role]);
    return res.status(201).json({ id: userId, email: em, full_name: fullName, role });
  } catch (err: any) { console.error('team add error:', err); return res.status(500).json({ error: err.message }); }
});
// DELETE /api/team/members/:userId
router.delete('/members/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Non autorizzato.' });
    const wsId = req.user!.workspaceId; const target = req.params.userId;
    const link = await queryOne<any>('SELECT role FROM workspace_users WHERE workspace_id=$1 AND user_id=$2', [wsId, target]);
    if (!link) return res.status(404).json({ error: 'Membro non trovato.' });
    if (link.role === 'owner') return res.status(400).json({ error: 'Non puoi rimuovere il titolare.' });
    if (target === req.user!.userId) return res.status(400).json({ error: 'Non puoi rimuovere te stesso.' });
    await query('DELETE FROM workspace_users WHERE workspace_id=$1 AND user_id=$2', [wsId, target]);
    await query(`UPDATE users SET deleted_at = NOW(), email = $1, full_name = 'Membro rimosso' WHERE id = $2`, ['removed_' + target + '@deleted.invalid', target]);
    return res.json({ ok: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});
export default router;
