import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Subquery costo porzione calcolato inline
const ITEM_COST_SUB = `(
  SELECT COALESCE(
    SUM(ri.quantity / NULLIF(i.conversion_factor,0)
        * COALESCE(ip.price_per_purchase_unit,0)
        * (1 + i.waste_pct/100.0)
    ) / NULLIF(MAX(r.yield_portions),0),
  0)
  FROM recipe_items ri
  JOIN ingredients i ON i.id = ri.ingredient_id
  LEFT JOIN ingredient_prices ip ON ip.ingredient_id = i.id
    AND ip.valid_from = (SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
  JOIN recipes r ON r.id = ri.recipe_id
  WHERE ri.recipe_id = mi.recipe_id
)`;

// GET /menus
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    let sql = `
      SELECT m.*, l.name as location_name,
             COUNT(mi.id) as item_count,
             ROUND(AVG(
               CASE WHEN mi.price > 0 AND mi.recipe_id IS NOT NULL THEN
                 ${ITEM_COST_SUB} / NULLIF(mi.price,0) * 100
               END
             )::numeric, 2) as avg_fc_pct
      FROM menus m
      LEFT JOIN locations l ON l.id = m.location_id
      LEFT JOIN menu_items mi ON mi.menu_id = m.id AND mi.status = 'active'
      WHERE m.workspace_id = $1 AND m.deleted_at IS NULL
    `;
    const params: any[] = [req.user!.workspaceId];
    if (locationId) { params.push(locationId); sql += ` AND m.location_id = $${params.length}`; }
    sql += ' GROUP BY m.id, l.name ORDER BY m.is_current DESC, m.name';

    const menus = await query(sql, params);
    return res.json(menus);
  } catch (err) {
    console.error('menus list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /menus/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const menu = await queryOne<any>(
      `SELECT m.*, l.name as location_name
       FROM menus m LEFT JOIN locations l ON l.id = m.location_id
       WHERE m.id = $1 AND m.workspace_id = $2 AND m.deleted_at IS NULL`,
      [req.params.id, req.user!.workspaceId]
    );
    if (!menu) return res.status(404).json({ error: 'Menu not found' });

    const items = await query(
      `SELECT mi.*,
              mc.name as category_name,
              r.name as recipe_name,
              COALESCE(${ITEM_COST_SUB}, 0) as cost_per_portion,
              CASE WHEN mi.price > 0 THEN
                ROUND((COALESCE(${ITEM_COST_SUB}, 0) / mi.price * 100)::numeric, 2)
              ELSE 0 END as fc_pct,
              mi.price - COALESCE(${ITEM_COST_SUB}, 0) as contribution_margin
       FROM menu_items mi
       LEFT JOIN menu_categories mc ON mc.id = mi.category_id
       LEFT JOIN recipes r ON r.id = mi.recipe_id
       WHERE mi.menu_id = $1
       ORDER BY mc.sort_order NULLS LAST, mi.sort_order`,
      [req.params.id]
    );

    const categories = await query(
      'SELECT * FROM menu_categories WHERE workspace_id = $1 ORDER BY sort_order',
      [req.user!.workspaceId]
    );

    const activeItems = (items as any[]).filter((i: any) => i.status === 'active' && parseFloat(i.fc_pct) > 0);
    const avg_fc_pct = activeItems.length > 0
      ? (activeItems.reduce((s: number, i: any) => s + parseFloat(i.fc_pct), 0) / activeItems.length).toFixed(2)
      : '0';

    return res.json({ ...menu, avg_fc_pct, items, categories });
  } catch (err) {
    console.error('menu get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /menus
router.post('/', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { locationId, name, isCurrent } = req.body;
    if (!locationId || !name) return res.status(400).json({ error: 'locationId and name are required' });

    const id = uuidv4();
    if (isCurrent) {
      await query('UPDATE menus SET is_current = false WHERE workspace_id = $1 AND location_id = $2', [req.user!.workspaceId, locationId]);
    }
    await query(
      'INSERT INTO menus (id, workspace_id, location_id, name, is_current) VALUES ($1,$2,$3,$4,$5)',
      [id, req.user!.workspaceId, locationId, name, isCurrent || false]
    );
    const created = await queryOne('SELECT * FROM menus WHERE id = $1', [id]);
    return res.status(201).json(created);
  } catch (err) {
    console.error('menu create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /menus/:id/items
router.post('/:id/items', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const menu = await queryOne('SELECT id FROM menus WHERE id = $1 AND workspace_id = $2', [req.params.id, req.user!.workspaceId]);
    if (!menu) return res.status(404).json({ error: 'Menu not found' });

    const { categoryId, recipeId, name, description, price, status } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

    const id = uuidv4();
    await query(
      `INSERT INTO menu_items (id, menu_id, category_id, recipe_id, name, description, price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.params.id, categoryId || null, recipeId || null, name, description || null, price, status || 'active']
    );

    const created = await queryOne(
      `SELECT mi.*,
              COALESCE(${ITEM_COST_SUB}, 0) as cost_per_portion,
              CASE WHEN mi.price > 0 THEN ROUND((COALESCE(${ITEM_COST_SUB}, 0) / mi.price * 100)::numeric, 2) ELSE 0 END as fc_pct,
              mi.price - COALESCE(${ITEM_COST_SUB}, 0) as contribution_margin
       FROM menu_items mi WHERE mi.id = $1`,
      [id]
    );
    return res.status(201).json(created);
  } catch (err) {
    console.error('menu item create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /menus/:id/items/:itemId
router.put('/:id/items/:itemId', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { name, description, price, status, categoryId, recipeId } = req.body;
    await query(
      `UPDATE menu_items SET name=$1, description=$2, price=$3, status=$4, category_id=$5, recipe_id=$6 WHERE id=$7 AND menu_id=$8`,
      [name, description || null, price, status || 'active', categoryId || null, recipeId || null, req.params.itemId, req.params.id]
    );
    const updated = await queryOne('SELECT * FROM menu_items WHERE id = $1', [req.params.itemId]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /menus/:id/items/:itemId
router.delete('/:id/items/:itemId', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM menu_items WHERE id = $1 AND menu_id = $2', [req.params.itemId, req.params.id]);
    return res.json({ message: 'Item removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
