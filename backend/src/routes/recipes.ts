import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Subquery inline per calcolo costo porzione
const COST_SUBQUERY = `(
  SELECT COALESCE(
    SUM(ri2.quantity / NULLIF(i2.conversion_factor, 0)
        * COALESCE(ip2.price_per_purchase_unit, 0)
        * (1 + i2.waste_pct / 100.0)
    ) / NULLIF(MAX(r2.yield_portions), 0),
  0)
  FROM recipe_items ri2
  JOIN ingredients i2 ON i2.id = ri2.ingredient_id
  LEFT JOIN ingredient_prices ip2 ON ip2.ingredient_id = i2.id
    AND ip2.valid_from = (
      SELECT MAX(valid_from) FROM ingredient_prices
      WHERE ingredient_id = i2.id AND valid_from <= CURRENT_DATE
    )
  JOIN recipes r2 ON r2.id = ri2.recipe_id
  WHERE ri2.recipe_id = r.id
)`;

// GET /recipes/categories/list  — DEVE stare PRIMA di /:id
router.get('/categories/list', authenticate, async (req: Request, res: Response) => {
  try {
    const cats = await query(
      'SELECT * FROM recipe_categories WHERE workspace_id = $1 ORDER BY sort_order',
      [req.user!.workspaceId]
    );
    return res.json(cats);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /recipes
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { categoryId, search } = req.query;
    let sql = `
      SELECT r.*, rc.name as category_name,
             COUNT(ri.id) as ingredient_count,
             COALESCE(${COST_SUBQUERY}, 0) as cost_per_portion
      FROM recipes r
      LEFT JOIN recipe_categories rc ON rc.id = r.category_id
      LEFT JOIN recipe_items ri ON ri.recipe_id = r.id
      WHERE r.workspace_id = $1 AND r.deleted_at IS NULL
    `;
    const params: any[] = [req.user!.workspaceId];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND r.category_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND r.name ILIKE $${params.length}`;
    }
    sql += ' GROUP BY r.id, rc.name, rc.sort_order ORDER BY rc.sort_order NULLS LAST, r.name';

    const recipes = await query(sql, params);
    return res.json(recipes);
  } catch (err) {
    console.error('recipes list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /recipes/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const recipe = await queryOne<any>(
      `SELECT r.*, rc.name as category_name,
              COALESCE(${COST_SUBQUERY}, 0) as cost_per_portion
       FROM recipes r
       LEFT JOIN recipe_categories rc ON rc.id = r.category_id
       WHERE r.id = $1 AND r.workspace_id = $2 AND r.deleted_at IS NULL`,
      [req.params.id, req.user!.workspaceId]
    );
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const items = await query(
      `SELECT ri.*, i.name as ingredient_name, i.recipe_unit, i.purchase_unit,
              i.waste_pct, i.yield_pct, i.conversion_factor,
              COALESCE(ip.price_per_purchase_unit, 0) as price_per_purchase_unit,
              COALESCE(
                ri.quantity / NULLIF(i.conversion_factor, 0)
                * ip.price_per_purchase_unit
                * (1 + i.waste_pct / 100.0),
                0
              ) as line_cost
       FROM recipe_items ri
       JOIN ingredients i ON i.id = ri.ingredient_id
       LEFT JOIN ingredient_prices ip ON ip.ingredient_id = i.id
         AND ip.valid_from = (
           SELECT MAX(valid_from) FROM ingredient_prices
           WHERE ingredient_id = i.id AND valid_from <= CURRENT_DATE
         )
       WHERE ri.recipe_id = $1
       ORDER BY ri.sort_order`,
      [req.params.id]
    );

    const totalCost = items.reduce((s: number, it: any) => s + parseFloat(it.line_cost || 0), 0);
    const summary = {
      totalCost: +totalCost.toFixed(4),
      yieldPortions: recipe.yield_portions,
      costPerPortion: recipe.yield_portions > 0 ? +(totalCost / recipe.yield_portions).toFixed(4) : 0,
    };

    return res.json({ ...recipe, items, summary });
  } catch (err) {
    console.error('recipe get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /recipes
router.post('/', authenticate, requireRoles('owner', 'admin', 'manager', 'kitchen'), async (req: Request, res: Response) => {
  try {
    const { categoryId, name, description, yieldPortions, prepTimeMin, cookTimeMin, items } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = uuidv4();
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO recipes (id, workspace_id, category_id, name, description, yield_portions, prep_time_min, cook_time_min, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, req.user!.workspaceId, categoryId || null, name, description || null,
          yieldPortions || 1, prepTimeMin || 0, cookTimeMin || 0, req.user!.userId]
      );
      if (items && Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await client.query(
            `INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, item_type, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, item.ingredientId, item.quantity, item.unit || 'g', item.itemType || 'primary', i + 1]
          );
        }
      }
    });

    const created = await queryOne('SELECT * FROM recipes WHERE id = $1', [id]);
    return res.status(201).json(created);
  } catch (err) {
    console.error('recipe create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /recipes/:id
router.put('/:id', authenticate, requireRoles('owner', 'admin', 'manager', 'kitchen'), async (req: Request, res: Response) => {
  try {
    const recipe = await queryOne('SELECT id FROM recipes WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL', [req.params.id, req.user!.workspaceId]);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const { categoryId, name, description, yieldPortions, prepTimeMin, cookTimeMin, items } = req.body;

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE recipes SET category_id=$1, name=$2, description=$3, yield_portions=$4,
         prep_time_min=$5, cook_time_min=$6 WHERE id=$7`,
        [categoryId || null, name, description || null,
          yieldPortions || 1, prepTimeMin || 0, cookTimeMin || 0, req.params.id]
      );
      if (items && Array.isArray(items)) {
        await client.query('DELETE FROM recipe_items WHERE recipe_id = $1', [req.params.id]);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await client.query(
            `INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, item_type, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [req.params.id, item.ingredientId, item.quantity, item.unit || 'g', item.itemType || 'primary', i + 1]
          );
        }
      }
    });

    const updated = await queryOne('SELECT * FROM recipes WHERE id = $1', [req.params.id]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /recipes/:id/clone
router.post('/:id/clone', authenticate, requireRoles('owner', 'admin', 'manager', 'kitchen'), async (req: Request, res: Response) => {
  try {
    const recipe = await queryOne<any>('SELECT * FROM recipes WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL', [req.params.id, req.user!.workspaceId]);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const items = await query('SELECT * FROM recipe_items WHERE recipe_id = $1', [req.params.id]);
    const newId = uuidv4();

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO recipes (id, workspace_id, category_id, name, description, yield_portions, prep_time_min, cook_time_min, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newId, req.user!.workspaceId, recipe.category_id, `${recipe.name} (copia)`,
          recipe.description, recipe.yield_portions, recipe.prep_time_min, recipe.cook_time_min, req.user!.userId]
      );
      for (const item of items as any[]) {
        await client.query(
          'INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, item_type, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
          [newId, item.ingredient_id, item.quantity, item.unit, item.item_type, item.sort_order]
        );
      }
    });

    const cloned = await queryOne('SELECT * FROM recipes WHERE id = $1', [newId]);
    return res.status(201).json(cloned);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /recipes/:id
router.delete('/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    await query('UPDATE recipes SET deleted_at = NOW() WHERE id = $1 AND workspace_id = $2', [req.params.id, req.user!.workspaceId]);
    return res.json({ message: 'Recipe deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
