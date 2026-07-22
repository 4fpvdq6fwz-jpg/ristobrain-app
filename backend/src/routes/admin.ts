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

// GET /api/admin/referral-codes — master: elenco codici con riepilogo maturato
router.get('/referral-codes', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isMaster(req)) return res.status(403).json({ error: 'Accesso riservato' });
    const rows = await query<any>(
      `SELECT rc.code, rc.referrer_name, rc.amount_cents, rc.active, rc.created_at,
              (SELECT COUNT(*) FROM workspaces w WHERE w.referral_code = rc.code)::int AS customers,
              (SELECT COUNT(*) FROM referral_earnings re WHERE re.code = rc.code)::int AS months,
              (SELECT COALESCE(SUM(amount_cents),0) FROM referral_earnings re WHERE re.code = rc.code)::int AS total_cents
       FROM referral_codes rc
       ORDER BY rc.created_at DESC`
    );
    return res.json({ codes: rows });
  } catch (err) {
    console.error('Admin referral list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/referral-codes — master: crea un nuovo codice segnalazione
router.post('/referral-codes', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isMaster(req)) return res.status(403).json({ error: 'Accesso riservato' });
    const { code, referrerName, amountCents } = req.body || {};
    if (!code || !referrerName) return res.status(400).json({ error: 'code e referrerName obbligatori' });
    const cleanCode = String(code).trim();
    const amt = Number.isFinite(Number(amountCents)) && Number(amountCents) > 0 ? Math.round(Number(amountCents)) : 200;
    const exists = await queryOne<any>('SELECT code FROM referral_codes WHERE LOWER(code) = LOWER($1)', [cleanCode]);
    if (exists) return res.status(409).json({ error: 'Codice gia esistente' });
    const ownerEmail = (req.body && req.body.ownerEmail) ? String(req.body.ownerEmail).trim().toLowerCase() : '';
        let ownerId: string | null = null;
        if (ownerEmail) {
          const ou = await queryOne<any>('SELECT id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL', [ownerEmail]);
          if (ou) ownerId = ou.id;
        }
        await query('INSERT INTO referral_codes (code, referrer_name, amount_cents, owner_user_id) VALUES ($1, $2, $3, $4)', [cleanCode, String(referrerName).trim(), amt, ownerId]);
        if (ownerId) { try { await query("UPDATE referral_requests SET status = 'handled' WHERE user_id = $1 AND status = 'pending'", [ownerId]); } catch (e) {} }
    return res.status(201).json({ code: cleanCode, referrer_name: String(referrerName).trim(), amount_cents: amt });
  } catch (err) {
    console.error('Admin referral create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/referral-codes/toggle — master: attiva/disattiva un codice
router.post('/referral-codes/toggle', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isMaster(req)) return res.status(403).json({ error: 'Accesso riservato' });
    const { code, active } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code obbligatorio' });
    await query('UPDATE referral_codes SET active = $1 WHERE LOWER(code) = LOWER($2)', [active !== false, String(code).trim()]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Admin referral toggle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/referral-requests — richieste di codice in attesa
router.get('/referral-requests', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isMaster(req)) return res.status(403).json({ error: 'Accesso riservato' });
    const rows = await query<any>("SELECT rr.id, rr.user_id, rr.email, rr.full_name, rr.created_at FROM referral_requests rr WHERE rr.status = 'pending' ORDER BY rr.created_at ASC");
    return res.json({ requests: rows });
  } catch (err) {
    console.error('Admin referral-requests error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
