import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const locations = await query(
      'SELECT * FROM locations WHERE workspace_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.user!.workspaceId]
    );
    return res.json(locations);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const loc = await queryOne(
      'SELECT * FROM locations WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user!.workspaceId]
    );
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    return res.json(loc);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { name, address, city, seats, cuisineType, targetFcDefault } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = uuidv4();
    await query(
      `INSERT INTO locations (id, workspace_id, name, address, city, seats, cuisine_type, target_fc_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.user!.workspaceId, name, address || null, city || null,
        seats || null, cuisineType || null, targetFcDefault || 30]
    );
    const created = await queryOne('SELECT * FROM locations WHERE id = $1', [id]);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { name, address, city, seats, cuisineType, targetFcDefault } = req.body;
    await query(
      `UPDATE locations SET name=$1, address=$2, city=$3, seats=$4, cuisine_type=$5, target_fc_default=$6
       WHERE id=$7 AND workspace_id=$8`,
      [name, address || null, city || null, seats || null, cuisineType || null,
        targetFcDefault || 30, req.params.id, req.user!.workspaceId]
    );
    const updated = await queryOne('SELECT * FROM locations WHERE id = $1', [req.params.id]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRoles('owner'), async (req: Request, res: Response) => {
  try {
    await query('UPDATE locations SET deleted_at = NOW() WHERE id = $1 AND workspace_id = $2', [req.params.id, req.user!.workspaceId]);
    return res.json({ message: 'Location deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
