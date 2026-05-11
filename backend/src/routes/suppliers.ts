import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const suppliers = await query(
      'SELECT * FROM suppliers WHERE workspace_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.user!.workspaceId]
    );
    return res.json(suppliers);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const s = await queryOne(
      'SELECT * FROM suppliers WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user!.workspaceId]
    );
    if (!s) return res.status(404).json({ error: 'Supplier not found' });
    return res.json(s);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { name, contactName, email, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = uuidv4();
    await query(
      'INSERT INTO suppliers (id, workspace_id, name, contact_name, email, phone, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, req.user!.workspaceId, name, contactName || null, email || null, phone || null, notes || null]
    );
    const created = await queryOne('SELECT * FROM suppliers WHERE id = $1', [id]);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { name, contactName, email, phone, notes } = req.body;
    await query(
      'UPDATE suppliers SET name=$1, contact_name=$2, email=$3, phone=$4, notes=$5 WHERE id=$6 AND workspace_id=$7',
      [name, contactName || null, email || null, phone || null, notes || null, req.params.id, req.user!.workspaceId]
    );
    const updated = await queryOne('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    await query('UPDATE suppliers SET deleted_at = NOW() WHERE id = $1 AND workspace_id = $2', [req.params.id, req.user!.workspaceId]);
    return res.json({ message: 'Supplier deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
