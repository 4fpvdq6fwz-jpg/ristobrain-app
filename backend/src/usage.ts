import { query, queryOne } from './db';

// Limiti d'uso AI per piano di abbonamento.
// Consulente AI = tetto mensile. Motore Creatività = tetto totale (lifetime).
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

export async function getPlan(workspaceId: string): Promise<Plan> {
  const row = await queryOne<any>('SELECT plan FROM workspaces WHERE id = $1', [workspaceId]);
  return planOf(row?.plan);
}

async function getCount(workspaceId: string, kind: string, period: string): Promise<number> {
  const row = await queryOne<any>(
    'SELECT count FROM ai_usage WHERE workspace_id=$1 AND kind=$2 AND period=$3',
    [workspaceId, kind, period]
  );
  return row ? parseInt(row.count) : 0;
}

export async function incUsage(workspaceId: string, kind: string, period: string): Promise<void> {
  try {
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

type Check = { ok: true; plan: Plan; used: number; limit: number } | { ok: false; message: string; plan: Plan };

export async function checkConsultant(workspaceId: string): Promise<Check> {
  const plan = await getPlan(workspaceId);
  const limit = CONSULTANT_MONTHLY[plan];
  const used = await getCount(workspaceId, 'consultant', monthPeriod());
  if (isFinite(limit) && used >= limit) {
    return {
      ok: false,
      plan,
      message: `Hai raggiunto il limite di ${limit} messaggi del Consulente AI del piano ${plan.toUpperCase()} per questo mese. Passa a Pro per continuare.`,
    };
  }
  return { ok: true, plan, used, limit };
}

export async function checkCreativity(workspaceId: string): Promise<Check> {
  const plan = await getPlan(workspaceId);
  const limit = CREATIVITY_TOTAL[plan];
  const used = await getCount(workspaceId, 'creativity', 'total');
  if (isFinite(limit) && used >= limit) {
    return {
      ok: false,
      plan,
      message: `Il Motore Creatività è incluso nei piani Pro e Business. Hai esaurito le ${limit} prove gratuite del piano ${plan.toUpperCase()}. Passa a Pro per generare menu senza limiti.`,
    };
  }
  return { ok: true, plan, used, limit };
}
