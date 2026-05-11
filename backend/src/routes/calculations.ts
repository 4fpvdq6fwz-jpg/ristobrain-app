import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /calc/recipe/:id
router.get('/recipe/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const recipe = await queryOne<any>(
      `SELECT r.*, rc.name as category_name, rc.target_fc_pct
       FROM recipes r LEFT JOIN recipe_categories rc ON rc.id = r.category_id
       WHERE r.id = $1 AND r.workspace_id = $2 AND r.deleted_at IS NULL`,
      [req.params.id, req.user!.workspaceId]
    );
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const items = await query<any>(
      `SELECT ri.*, i.name as ingredient_name, i.recipe_unit, i.waste_pct, i.yield_pct,
              i.conversion_factor, i.purchase_unit,
              COALESCE(ip.price_per_purchase_unit, 0) as price_per_pu,
              ROUND((ri.quantity / NULLIF(i.conversion_factor,0)
                    * COALESCE(ip.price_per_purchase_unit,0)
                    * (1 + i.waste_pct/100.0))::numeric, 4) as line_cost
       FROM recipe_items ri
       JOIN ingredients i ON i.id = ri.ingredient_id
       LEFT JOIN ingredient_prices ip ON ip.ingredient_id = i.id
         AND ip.valid_from = (SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
       WHERE ri.recipe_id = $1 ORDER BY ri.sort_order`,
      [req.params.id]
    );

    const totalCost = items.reduce((s: number, it: any) => s + parseFloat(it.line_cost || 0), 0);
    const costPerPortion = totalCost / Math.max(recipe.yield_portions, 1);

    return res.json({
      recipe,
      items,
      summary: {
        totalCost: +totalCost.toFixed(4),
        yieldPortions: recipe.yield_portions,
        costPerPortion: +costPerPortion.toFixed(4),
        targetFcPct: recipe.target_fc_pct,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /calc/menu/:menuId
router.get('/menu/:menuId', authenticate, async (req: Request, res: Response) => {
  try {
    const menu = await queryOne('SELECT * FROM menus WHERE id=$1 AND workspace_id=$2', [req.params.menuId, req.user!.workspaceId]);
    if (!menu) return res.status(404).json({ error: 'Menu not found' });

    const items = await query<any>(
      `SELECT mi.id, mi.name, mi.price,
              mc.name as category_name, mc.target_fc_pct,
              COALESCE((
                SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                       /NULLIF(MAX(r.yield_portions),0)
                FROM recipe_items ri
                JOIN ingredients i ON i.id=ri.ingredient_id
                LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                  AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                JOIN recipes r ON r.id=ri.recipe_id
                WHERE ri.recipe_id=mi.recipe_id
              ),0) as cost_per_portion,
              CASE WHEN mi.price>0 THEN ROUND((
                COALESCE((
                  SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                         /NULLIF(MAX(r.yield_portions),0)
                  FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
                  LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                    AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                  JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id
                ),0)/mi.price*100)::numeric,2) ELSE 0 END as fc_pct,
              mi.price - COALESCE((
                SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                       /NULLIF(MAX(r.yield_portions),0)
                FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
                LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                  AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id
              ),0) as contribution_margin
       FROM menu_items mi
       LEFT JOIN menu_categories mc ON mc.id=mi.category_id
       WHERE mi.menu_id=$1 AND mi.status='active'
       ORDER BY mc.sort_order NULLS LAST, mi.sort_order`,
      [req.params.menuId]
    );

    const avgFc = items.length > 0
      ? items.reduce((s: number, i: any) => s + parseFloat(i.fc_pct || 0), 0) / items.length : 0;

    return res.json({ menu, items, summary: { avgFcPct: +avgFc.toFixed(2), itemCount: items.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /calc/engineering?periodId=xxx
router.get('/engineering', authenticate, async (req: Request, res: Response) => {
  try {
    const { periodId } = req.query;
    if (!periodId) return res.status(400).json({ error: 'periodId is required' });

    const period = await queryOne<any>('SELECT * FROM sales_periods WHERE id=$1 AND workspace_id=$2', [periodId, req.user!.workspaceId]);
    if (!period) return res.status(404).json({ error: 'Sales period not found' });

    const items = await query<any>(
      `SELECT sl.item_name, sl.qty_sold, sl.unit_price, sl.total_revenue, sl.menu_item_id,
              COALESCE((
                SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                       /NULLIF(MAX(r.yield_portions),0)
                FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
                LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                  AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                JOIN recipes r ON r.id=ri.recipe_id
                WHERE ri.recipe_id=mi.recipe_id
              ),0) as cost_per_portion,
              CASE WHEN mi.price>0 THEN ROUND((
                COALESCE((
                  SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                         /NULLIF(MAX(r.yield_portions),0)
                  FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
                  LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                    AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                  JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id
                ),0)/mi.price*100)::numeric,2) ELSE 0 END as fc_pct,
              mi.price - COALESCE((
                SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                       /NULLIF(MAX(r.yield_portions),0)
                FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
                LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                  AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id
              ),0) as contribution_margin
       FROM sales_lines sl
       LEFT JOIN menu_items mi ON mi.id=sl.menu_item_id
       WHERE sl.sales_period_id=$1
       ORDER BY sl.qty_sold DESC`,
      [periodId]
    );

    const totalQty = items.reduce((s: number, i: any) => s + parseInt(i.qty_sold), 0);
    const avgCm = items.length > 0 ? items.reduce((s: number, i: any) => s + parseFloat(i.contribution_margin), 0) / items.length : 0;
    const avgPop = totalQty / Math.max(items.length, 1);

    const matrix = items.map((item: any) => {
      const qty = parseInt(item.qty_sold);
      const cm = parseFloat(item.contribution_margin);
      const isHighPop = qty >= avgPop * 0.7;
      const isHighCm = cm >= avgCm;
      let quadrant = isHighPop && isHighCm ? 'star' : !isHighPop && isHighCm ? 'puzzle' : isHighPop ? 'plowhorse' : 'dog';
      return { ...item, qty_sold: qty, fc_pct: parseFloat(item.fc_pct), contribution_margin: cm,
               total_cm: cm * qty, quadrant, isHighPopularity: isHighPop, isHighCm };
    });

    const summary = {
      totalRevenue: items.reduce((s: number, i: any) => s + parseFloat(i.total_revenue), 0),
      totalCm: matrix.reduce((s: number, i: any) => s + i.total_cm, 0),
      avgFcPct: items.length > 0 ? items.reduce((s: number, i: any) => s + parseFloat(i.fc_pct), 0) / items.length : 0,
      avgCm,
      quadrantCounts: { star: matrix.filter((i: any) => i.quadrant==='star').length, puzzle: matrix.filter((i: any) => i.quadrant==='puzzle').length,
                        plowhorse: matrix.filter((i: any) => i.quadrant==='plowhorse').length, dog: matrix.filter((i: any) => i.quadrant==='dog').length },
    };

    return res.json({ period, matrix, summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /calc/pricing-suggestions?menuId=xxx&targetFcPct=30
router.get('/pricing-suggestions', authenticate, async (req: Request, res: Response) => {
  try {
    const { menuId, targetFcPct } = req.query;
    if (!menuId) return res.status(400).json({ error: 'menuId is required' });
    const target = parseFloat(targetFcPct as string) || 30;

    const items = await query<any>(
      `SELECT mi.id, mi.name, mi.price,
              COALESCE((
                SELECT SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))
                       /NULLIF(MAX(r.yield_portions),0)
                FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
                LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id
                  AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
                JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id
              ),0) as cost_per_portion
       FROM menu_items mi WHERE mi.menu_id=$1 AND mi.status='active'`,
      [menuId]
    );

    const suggestions = items.map((item: any) => {
      const cost = parseFloat(item.cost_per_portion);
      const currentPrice = parseFloat(item.price);
      const currentFcPct = currentPrice > 0 ? +(cost / currentPrice * 100).toFixed(2) : 0;
      const suggestedPrice = cost > 0 ? +(cost / (target / 100)).toFixed(2) : currentPrice;
      const priceDiff = +(suggestedPrice - currentPrice).toFixed(2);
      return { id: item.id, name: item.name, currentPrice, costPerPortion: cost, currentFcPct,
               suggestedPrice, priceDiff, targetFcPct: target,
               action: Math.abs(priceDiff) < 0.5 ? 'ok' : priceDiff > 0 ? 'increase' : 'decrease' };
    });

    return res.json({ suggestions, targetFcPct: target });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
