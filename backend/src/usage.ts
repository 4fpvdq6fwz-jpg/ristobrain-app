import { query, queryOne } from './db';

// Limiti d'uso AI per piano di abbonamento.
// Consulente AI = tetto mensile. Motore Creatività = tetto totale (lifetime).
// Resiliente: crea la tabella al bisogno e in caso di errore lascia passare (fail-open),
// così un problema di limiti non blocca mai l'AI.
type Plan = 'free' | 'base' | 'pro' | 'business';

const CONSULTANT_MONTHLY: Record<Plan, number> = { free: 10, base: 30, pro: 300, business: Infinity };
const CREATIVITY_TOTAL: Record<Plan, number> = { free: 2, base: 2, pro: Infinity, business: Infinity };

function planOf(p: any): Plan {
  const v = String(p || 'free').toLowerCase();
  return (['free', 'base', 'pro', 'business'].includes(v) ? v : 'free') as Plan;
}

export function monthPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

let tableReady = false;
async function ensureTable(): Promise<boolean> {
  if (tableReady) return true;
  try {
    await query(`CREATE TABLE IF NOT EXISTS ai_usage (
      workspace_id UUID NOT NULL,
      kind TEXT NOT NULL,
      period TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (workspace_id, kind, period)
    )`);
    tableReady = true;
    return true;
  } catch (e) {
    console.error('ensure ai_usage table failed:', e);
    return false;
  }
}

export async function getPlan(workspaceId: string): Promise<Plan> {
  try {
    const row = await queryOne<any>('SELECT plan FROM workspaces WHERE id = $1', [workspaceId]);
    return planOf(row?.plan);
  } catch {
    return 'free';
  }
}

async function getCount(workspaceId: string, kind: string, period: string): Promise<number> {
  try {
    if (!(await ensureTable())) return 0;
    const row = await queryOne<any>(
      'SELECT count FROM ai_usage WHERE workspace_id=$1 AND kind=$2 AND period=$3',
      [workspaceId, kind, period]
    );
    return row ? parseInt(row.count) : 0;
  } catch (e) {
    console.error('getCount error (fail-open):', e);
    return 0;
  }
}

export async function incUsage(workspaceId: string, kind: string, period: string): Promise<void> {
  try {
    if (!(await ensureTable())) return;
    await query(
      `INSERT INTO ai_usage (workspace_id, kind, period, count, updated_at)
       VALUES ($1,$2,$3,1,NOW())
       ON CONFLICT (workspace_id, kind, period)
       DO UPDATE SET count = ai_usage.count + 1, updated_at = NOW()`,
      [workspaceId, kind, period]
    );
  } catch (e) {
    console.error('incUsage error (non bloccante):', e);
  }
}

type Check = { ok: true } | { ok: false; message: string };

export async function checkConsultant(workspaceId: string): Promise<Check> {
  const plan = await getPlan(workspaceId);
  const limit = CONSULTANT_MONTHLY[plan];
  if (!isFinite(limit)) return { ok: true };
  const used = await getCount(workspaceId, 'consultant', monthPeriod());
  if (used >= limit) {
    return { ok: false, message: `Hai raggiunto il limite di ${limit} messaggi del Consulente AI del piano ${plan.toUpperCase()} per questo mese. Passa a Pro per continuare.` };
  }
  return { ok: true };
}

export async function checkCreativity(workspaceId: string): Promise<Check> {
  const plan = await getPlan(workspaceId);
  const limit = CREATIVITY_TOTAL[plan];
  if (!isFinite(limit)) return { ok: true };
  const used = await getCount(workspaceId, 'creativity', 'total');
  if (used >= limit) {
    return { ok: false, message: `Il Motore Creatività è incluso nei piani Pro e Business. Hai esaurito le ${limit} prove gratuite del piano ${plan.toUpperCase()}. Passa a Pro per generare menu senza limiti.` };
  }
  return { ok: true };
}
