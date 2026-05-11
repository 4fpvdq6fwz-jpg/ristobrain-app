import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// GET /sales
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    let sql = `
      SELECT sp.*, l.name as location_name,
             COALESCE(SUM(sl.total_revenue), 0) as total_revenue,
             COALESCE(SUM(sl.qty_sold), 0) as total_qty
      FROM sales_periods sp
      LEFT JOIN locations l ON l.id = sp.location_id
      LEFT JOIN sales_lines sl ON sl.sales_period_id = sp.id
      WHERE sp.workspace_id = $1
    `;
    const params: any[] = [req.user!.workspaceId];

    if (locationId) {
      params.push(locationId);
      sql += ` AND sp.location_id = $${params.length}`;
    }
    sql += ' GROUP BY sp.id, l.name ORDER BY sp.period_from DESC';

    const periods = await query(sql, params);
    return res.json(periods);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sales/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const period = await queryOne<any>(
      `SELECT sp.*, l.name as location_name
       FROM sales_periods sp LEFT JOIN locations l ON l.id = sp.location_id
       WHERE sp.id = $1 AND sp.workspace_id = $2`,
      [req.params.id, req.user!.workspaceId]
    );
    if (!period) return res.status(404).json({ error: 'Sales period not found' });

    const lines = await query(
      `SELECT sl.*, mi.price as menu_price,
              COALESCE((SELECT COALESCE(SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))/NULLIF(MAX(r.yield_portions),0),0) FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE) JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id),0) as cost_per_portion,
              CASE WHEN mi.price>0 THEN ROUND((COALESCE((SELECT COALESCE(SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))/NULLIF(MAX(r.yield_portions),0),0) FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE) JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id),0)/mi.price*100)::numeric,2) ELSE 0 END as fc_pct,
              COALESCE((SELECT COALESCE(SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))/NULLIF(MAX(r.yield_portions),0),0) FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE) JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id),0) * sl.qty_sold as total_cost
       FROM sales_lines sl
       LEFT JOIN menu_items mi ON mi.id = sl.menu_item_id
       WHERE sl.sales_period_id = $1
       ORDER BY sl.total_revenue DESC`,
      [req.params.id]
    );

    const totals = lines.reduce((acc: any, l: any) => {
      acc.revenue += parseFloat(l.total_revenue) || 0;
      acc.cost += parseFloat(l.total_cost) || 0;
      acc.qty += parseInt(l.qty_sold) || 0;
      return acc;
    }, { revenue: 0, cost: 0, qty: 0 });

    totals.fcPct = totals.revenue > 0 ? (totals.cost / totals.revenue * 100).toFixed(2) : 0;

    return res.json({ ...period, lines, totals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sales (create period + lines manually)
router.post('/', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { locationId, name, periodFrom, periodTo, totalCovers, lines } = req.body;
    if (!locationId || !name || !periodFrom || !periodTo) {
      return res.status(400).json({ error: 'locationId, name, periodFrom, periodTo are required' });
    }

    const id = uuidv4();
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO sales_periods (id, workspace_id, location_id, name, period_from, period_to, source, total_covers)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, req.user!.workspaceId, locationId, name, periodFrom, periodTo, 'manual', totalCovers || null]
      );

      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          await client.query(
            `INSERT INTO sales_lines (sales_period_id, menu_item_id, item_name, qty_sold, unit_price, total_revenue)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, line.menuItemId || null, line.itemName, line.qtySold, line.unitPrice, line.totalRevenue]
          );
        }
      }
    });

    const created = await queryOne('SELECT * FROM sales_periods WHERE id = $1', [id]);
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /sales/:id
router.delete('/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    await withTransaction(async (client) => {
      await client.query('DELETE FROM sales_lines WHERE sales_period_id = $1', [req.params.id]);
      await client.query('DELETE FROM sales_periods WHERE id = $1 AND workspace_id = $2', [req.params.id, req.user!.workspaceId]);
    });
    return res.json({ message: 'Sales period deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
