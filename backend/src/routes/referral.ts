import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { query, queryOne } from '../db';
import { sendEmail } from '../mail';
import { config } from '../config';

const router = Router();

async function statsForCode(code: string) {
  const customers = await queryOne<any>('SELECT COUNT(*)::int AS n FROM workspaces WHERE referral_code = $1', [code]);
  const earn = await queryOne<any>('SELECT COUNT(*)::int AS months, COALESCE(SUM(amount_cents),0)::int AS total_cents FROM referral_earnings WHERE code = $1', [code]);
  return { customers: (customers && customers.n) || 0, months: (earn && earn.months) || 0, total_cents: (earn && earn.total_cents) || 0 };
}

// GET /api/referral/me — stato del segnalatore loggato
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const codeRow = await queryOne<any>('SELECT code, referrer_name, amount_cents, active FROM referral_codes WHERE owner_user_id = $1 ORDER BY created_at ASC LIMIT 1', [userId]);
    if (!codeRow) {
      const reqRow = await queryOne<any>('SELECT status FROM referral_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
      return res.json({ code: null, requested: !!reqRow });
    }
    const s = await statsForCode(codeRow.code);
    return res.json({ code: codeRow.code, amount_cents: codeRow.amount_cents, active: codeRow.active, customers: s.customers, months: s.months, total_cents: s.total_cents });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// POST /api/referral/request — richiedi un codice (avvisa il master)
router.post('/request', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const email = req.user!.email || '';
    const existingCode = await queryOne<any>('SELECT code FROM referral_codes WHERE owner_user_id = $1', [userId]);
    if (existingCode) return res.status(400).json({ error: 'Hai gia un codice attivo.' });
    const already = await queryOne<any>('SELECT id FROM referral_requests WHERE user_id = $1 AND status = $2', [userId, 'pending']);
    if (!already) {
      const u = await queryOne<any>('SELECT full_name FROM users WHERE id = $1', [userId]);
      await query('INSERT INTO referral_requests (user_id, email, full_name) VALUES ($1,$2,$3)', [userId, email, (u && u.full_name) || null]);
      try {
        const to = (config.masterEmails && config.masterEmails[0]) || email;
        await sendEmail({ to, subject: 'Nuova richiesta codice segnalazione', html: '<p>' + ((u && u.full_name) || 'Un utente') + ' (' + email + ') ha richiesto un codice segnalazione. Assegnaglielo dal pannello master.</p>' });
      } catch (e) { console.error('notify master failed:', e); }
    }
    return res.json({ ok: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// GET /api/referral/public/:code — stato pubblico per il link privato (no auth)
router.get('/public/:code', async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code || '').trim();
    const codeRow = await queryOne<any>('SELECT code, referrer_name, amount_cents FROM referral_codes WHERE LOWER(code) = LOWER($1)', [code]);
    if (!codeRow) return res.status(404).json({ error: 'Codice non trovato.' });
    const s = await statsForCode(codeRow.code);
    return res.json({ code: codeRow.code, referrer_name: codeRow.referrer_name, amount_cents: codeRow.amount_cents, customers: s.customers, months: s.months, total_cents: s.total_cents });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

export default router;
