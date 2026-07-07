import { Request, Response, NextFunction } from 'express';
import { queryOne } from '../db';

type Resource = 'recipes' | 'ingredients' | 'locations';

// Limiti per piano: undefined = illimitato
const LIMITS: Record<string, Partial<Record<Resource, number>>> = {
  free: { recipes: 30, ingredients: 50, locations: 1 },
  base: { locations: 1 },
  pro: {},
  business: {},
};

const LABELS: Record<Resource, string> = {
  recipes: 'ricette',
  ingredients: 'ingredienti',
  locations: 'locali',
};

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  base: 'Base',
  pro: 'Pro',
  business: 'Business',
};

/**
 * Blocca la creazione di una risorsa quando il piano del workspace
 * ha raggiunto il limite. Risponde 403 con code PLAN_LIMIT.
 */
export function enforcePlanLimit(resource: Resource) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const wsId = req.user!.workspaceId;
      const ws = await queryOne<{ plan: string }>(
        'SELECT plan FROM workspaces WHERE id = $1',
        [wsId]
      );
      const plan = ws?.plan && LIMITS[ws.plan] ? ws.plan : 'free';
      const limit = LIMITS[plan][resource];
      if (limit === undefined) { next(); return; }

      const row = await queryOne<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM ${resource} WHERE workspace_id = $1 AND deleted_at IS NULL`,
        [wsId]
      );
      const count = Number(row?.n ?? 0);
      if (count >= limit) {
        res.status(403).json({
          error: `Hai raggiunto il limite di ${limit} ${LABELS[resource]} del piano ${PLAN_NAMES[plan]}. Vai su "Piano" per passare a un piano superiore e continuare senza limiti.`,
          code: 'PLAN_LIMIT',
          plan,
          resource,
          limit,
        });
        return;
      }
      next();
    } catch (err) {
      // In caso di errore interno non blocchiamo l'operatività
      console.error('Plan limit check error:', err);
      next();
    }
  };
}
