import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const router = Router();
const upload = multer({ dest: config.uploadDir, limits: { fileSize: config.maxFileSize } });

// Ensure upload dir exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// GET /ingredients
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { categoryId, search } = req.query;
    let sql = `
      SELECT i.*, ic.name as category_name,
             ip.price_per_purchase_unit as current_price,
             s.name as supplier_name
      FROM ingredients i
      LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
      LEFT JOIN ingredient_prices ip ON ip.ingredient_id = i.id
        AND ip.valid_from = (
          SELECT MAX(valid_from) FROM ingredient_prices
          WHERE ingredient_id = i.id AND valid_from <= CURRENT_DATE
        )
      LEFT JOIN suppliers s ON s.id = i.primary_supplier_id
      WHERE i.workspace_id = $1 AND i.deleted_at IS NULL
    `;
    const params: any[] = [req.user!.workspaceId];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND i.category_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (i.name ILIKE $${params.length} OR i.code ILIKE $${params.length})`;
    }
    sql += ' ORDER BY ic.sort_order, i.name';

    const ingredients = await query(sql, params);
    return res.json(ingredients);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /ingredients/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const ing = await queryOne<any>(
      `SELECT i.*, ic.name as category_name, s.name as supplier_name
       FROM ingredients i
       LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
       LEFT JOIN suppliers s ON s.id = i.primary_supplier_id
       WHERE i.id = $1 AND i.workspace_id = $2 AND i.deleted_at IS NULL`,
      [req.params.id, req.user!.workspaceId]
    );
    if (!ing) return res.status(404).json({ error: 'Ingredient not found' });

    const prices = await query(
      'SELECT * FROM ingredient_prices WHERE ingredient_id = $1 ORDER BY valid_from DESC LIMIT 12',
      [req.params.id]
    );

    return res.json({ ...ing, priceHistory: prices });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /ingredients
router.post('/', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const {
      categoryId, code, name, purchaseUnit, recipeUnit, conversionFactor,
      wastePct, yieldPct, primarySupplierId, currentPrice
    } = req.body;

    if (!name || !purchaseUnit || !recipeUnit) {
      return res.status(400).json({ error: 'name, purchaseUnit, recipeUnit are required' });
    }

    const id = uuidv4();
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO ingredients (id, workspace_id, category_id, code, name, purchase_unit, recipe_unit,
         conversion_factor, waste_pct, yield_pct, primary_supplier_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, req.user!.workspaceId, categoryId || null, code || null, name,
          purchaseUnit, recipeUnit, conversionFactor || 1,
          wastePct || 0, yieldPct || 100, primarySupplierId || null]
      );

      if (currentPrice != null) {
        await client.query(
          'INSERT INTO ingredient_prices (ingredient_id, price_per_purchase_unit, valid_from) VALUES ($1,$2,CURRENT_DATE)',
          [id, currentPrice]
        );
      }
    });

    const created = await queryOne('SELECT * FROM ingredients WHERE id = $1', [id]);
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /ingredients/:id
router.put('/:id', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const ing = await queryOne(
      'SELECT id FROM ingredients WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user!.workspaceId]
    );
    if (!ing) return res.status(404).json({ error: 'Ingredient not found' });

    const { categoryId, code, name, purchaseUnit, recipeUnit, conversionFactor, wastePct, yieldPct, primarySupplierId } = req.body;

    await query(
      `UPDATE ingredients SET category_id=$1, code=$2, name=$3, purchase_unit=$4, recipe_unit=$5,
       conversion_factor=$6, waste_pct=$7, yield_pct=$8, primary_supplier_id=$9
       WHERE id=$10`,
      [categoryId || null, code || null, name, purchaseUnit, recipeUnit,
        conversionFactor || 1, wastePct || 0, yieldPct || 100,
        primarySupplierId || null, req.params.id]
    );

    const updated = await queryOne('SELECT * FROM ingredients WHERE id = $1', [req.params.id]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /ingredients/:id
router.delete('/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      'UPDATE ingredients SET deleted_at = NOW() WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user!.workspaceId]
    );
    return res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /ingredients/:id/prices
router.post('/:id/prices', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { pricePerPurchaseUnit, validFrom } = req.body;
    if (!pricePerPurchaseUnit) return res.status(400).json({ error: 'pricePerPurchaseUnit is required' });

    const ing = await queryOne('SELECT id FROM ingredients WHERE id = $1 AND workspace_id = $2', [req.params.id, req.user!.workspaceId]);
    if (!ing) return res.status(404).json({ error: 'Ingredient not found' });

    await query(
      'INSERT INTO ingredient_prices (ingredient_id, price_per_purchase_unit, valid_from) VALUES ($1,$2,$3) ON CONFLICT (ingredient_id, valid_from) DO UPDATE SET price_per_purchase_unit = EXCLUDED.price_per_purchase_unit',
      [req.params.id, pricePerPurchaseUnit, validFrom || new Date().toISOString().slice(0, 10)]
    );

    const prices = await query(
      'SELECT * FROM ingredient_prices WHERE ingredient_id = $1 ORDER BY valid_from DESC LIMIT 12',
      [req.params.id]
    );
    return res.json(prices);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /ingredients/categories/list
router.get('/categories/list', authenticate, async (req: Request, res: Response) => {
  try {
    const cats = await query(
      'SELECT * FROM ingredient_categories WHERE workspace_id = $1 ORDER BY sort_order',
      [req.user!.workspaceId]
    );
    return res.json(cats);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
