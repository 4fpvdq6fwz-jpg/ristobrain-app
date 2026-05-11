import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/test', async (req, res) => {
  const results: any = { ts: new Date().toISOString() };

  try {
    const wRow = (await pool.query('SELECT workspace_id FROM workspace_users LIMIT 1')).rows[0];
    const wid = wRow?.workspace_id;
    results.workspaceId = wid;

    // Test recipes
    try {
      const r = await pool.query(
        `SELECT r.id, r.name FROM recipes r WHERE r.workspace_id=$1 AND r.deleted_at IS NULL LIMIT 1`,
        [wid]
      );
      results.recipeSimple = r.rows[0]?.name || '(none)';
    } catch(e: any) { results.recipeSimpleErr = e.message; }

    // Test recipes with subquery
    try {
      const r = await pool.query(
        `SELECT r.id, r.name,
          (SELECT COALESCE(SUM(ri2.quantity/NULLIF(i2.conversion_factor,0)*COALESCE(ip2.price_per_purchase_unit,0)*(1+i2.waste_pct/100.0))/NULLIF(MAX(r2.yield_portions),0),0)
           FROM recipe_items ri2
           JOIN ingredients i2 ON i2.id=ri2.ingredient_id
           LEFT JOIN ingredient_prices ip2 ON ip2.ingredient_id=i2.id
             AND ip2.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i2.id AND valid_from<=CURRENT_DATE)
           JOIN recipes r2 ON r2.id=ri2.recipe_id
           WHERE ri2.recipe_id=r.id) as cost
        FROM recipes r WHERE r.workspace_id=$1 AND r.deleted_at IS NULL LIMIT 1`,
        [wid]
      );
      results.recipeWithCost = r.rows[0];
    } catch(e: any) { results.recipeWithCostErr = e.message; }

    // Test menus
    try {
      const r = await pool.query(
        `SELECT m.id, m.name, COUNT(mi.id) as item_count FROM menus m LEFT JOIN menu_items mi ON mi.menu_id=m.id WHERE m.workspace_id=$1 AND m.deleted_at IS NULL GROUP BY m.id LIMIT 1`,
        [wid]
      );
      results.menu = r.rows[0];
    } catch(e: any) { results.menuErr = e.message; }

    // Test menus with ITEM_COST_SUB in AVG aggregate
    try {
      const ITEM_COST_SUB = `(SELECT COALESCE(SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))/NULLIF(MAX(r.yield_portions),0),0) FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE) JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id)`;
      const r = await pool.query(
        `SELECT m.id, m.name, ROUND(AVG(CASE WHEN mi.price>0 AND mi.recipe_id IS NOT NULL THEN ${ITEM_COST_SUB}/NULLIF(mi.price,0)*100 END)::numeric,2) as avg_fc
         FROM menus m LEFT JOIN menu_items mi ON mi.menu_id=m.id AND mi.status='active'
         WHERE m.workspace_id=$1 AND m.deleted_at IS NULL GROUP BY m.id LIMIT 1`,
        [wid]
      );
      results.menuWithFC = r.rows[0];
    } catch(e: any) { results.menuWithFCErr = e.message; }

  } catch(e: any) {
    results.fatalErr = e.message;
  }

  res.json(results);
});

export default router;
