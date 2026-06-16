import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /ai/knowledge — Lista materiali consulenza
router.get('/knowledge', authenticate, async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    const items = await query<any>(
      `SELECT id, title, content, source_type, created_at FROM ai_knowledge_base WHERE workspace_id=$1 ORDER BY created_at DESC`,
      [wsId]
    );
    return res.json(items);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /ai/knowledge — Aggiungi materiale consulenza
router.post('/knowledge', authenticate, async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    const userId = req.user!.userId;
    const { title, content, source_type = 'manual' } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titolo e contenuto obbligatori' });
    const rows = await query<any>(
      `INSERT INTO ai_knowledge_base (workspace_id, title, content, source_type, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [wsId, title, content, source_type, userId]
    );
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /ai/knowledge/:id — Elimina materiale
router.delete('/knowledge/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    await query(`DELETE FROM ai_knowledge_base WHERE id=$1 AND workspace_id=$2`, [req.params.id, wsId]);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /ai/suggest — Chiede a Claude consigli personalizzati sul ristorante
router.post('/suggest', authenticate, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    const wsId = req.user!.workspaceId;

    // Raccoglie dati reali dal DB + materiali consulenza
    const [recipes, menus, ingredients, recentSales, knowledge] = await Promise.all([
      query<any>(`
        SELECT r.name,
        COALESCE((SELECT COALESCE(SUM(ri2.quantity/NULLIF(i2.conversion_factor,0)*COALESCE(ip2.price_per_purchase_unit,0)*(1+i2.waste_pct/100.0))/NULLIF(MAX(r2.yield_portions),0),0)
        FROM recipe_items ri2 JOIN ingredients i2 ON i2.id=ri2.ingredient_id
        LEFT JOIN ingredient_prices ip2 ON ip2.ingredient_id=i2.id AND ip2.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i2.id AND valid_from<=CURRENT_DATE)
        JOIN recipes r2 ON r2.id=ri2.recipe_id WHERE ri2.recipe_id=r.id),0) as costo_porzione
        FROM recipes r WHERE r.workspace_id=$1 AND r.deleted_at IS NULL LIMIT 10`, [wsId]),

      query<any>(`
        SELECT m.name as menu, mi.name as piatto, mi.price as prezzo,
        CASE WHEN mi.price>0 THEN ROUND((COALESCE((SELECT COALESCE(SUM(ri.quantity/NULLIF(i.conversion_factor,0)*COALESCE(ip.price_per_purchase_unit,0)*(1+i.waste_pct/100.0))/NULLIF(MAX(r.yield_portions),0),0)
        FROM recipe_items ri JOIN ingredients i ON i.id=ri.ingredient_id
        LEFT JOIN ingredient_prices ip ON ip.ingredient_id=i.id AND ip.valid_from=(SELECT MAX(valid_from) FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE)
        JOIN recipes r ON r.id=ri.recipe_id WHERE ri.recipe_id=mi.recipe_id),0)/mi.price*100)::numeric,1) ELSE 0 END as fc_pct
        FROM menus m JOIN menu_items mi ON mi.menu_id=m.id AND mi.status='active'
        WHERE m.workspace_id=$1 AND m.deleted_at IS NULL LIMIT 15`, [wsId]),

      query<any>(`SELECT name, purchase_unit, COALESCE((SELECT price_per_purchase_unit FROM ingredient_prices WHERE ingredient_id=i.id AND valid_from<=CURRENT_DATE ORDER BY valid_from DESC LIMIT 1),0) as prezzo FROM ingredients i WHERE i.workspace_id=$1 AND i.deleted_at IS NULL LIMIT 10`, [wsId]),

      query<any>(`SELECT sp.name as periodo, SUM(sl.total_revenue) as revenue, SUM(sl.qty_sold) as coperti FROM sales_periods sp JOIN sales_lines sl ON sl.sales_period_id=sp.id WHERE sp.workspace_id=$1 GROUP BY sp.id, sp.name ORDER BY sp.period_from DESC LIMIT 3`, [wsId]),

      query<any>(`SELECT title, content FROM ai_knowledge_base WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 5`, [wsId]),
    ]);

    // Sezione knowledge base nel prompt
    const knowledgeSection = knowledge.length > 0
      ? `\n\nMateriali di consulenza del consulente (usa il suo stile e approccio):\n` + knowledge.map((k: any) => `### ${k.title}\n${k.content}`).join('\n\n')
      : '';

    const systemPrompt = `Sei un consulente esperto di gestione ristorante e food cost. Dai consigli precisi, pratici e in italiano.${knowledgeSection}

Dati del ristorante del cliente:
- Ricette: ${recipes.map((r: any) => `${r.name} (costo porzione: €${parseFloat(r.costo_porzione).toFixed(2)})`).join(', ') || 'nessuna'}
- Menu attivo: ${menus.map((m: any) => `${m.piatto} €${m.prezzo} (FC: ${m.fc_pct}%)`).join(', ') || 'nessun piatto'}
- Ingredienti principali: ${ingredients.map((i: any) => `${i.name} €${parseFloat(i.prezzo).toFixed(2)}/${i.purchase_unit}`).join(', ') || 'nessuno'}
- Vendite recenti: ${recentSales.map((s: any) => `${s.periodo}: €${parseFloat(s.revenue).toFixed(0)}`).join(', ') || 'nessun dato'}

Regole:
- Rispondi SEMPRE in italiano
- Sii specifico con i numeri (food cost %, prezzi consigliati, ecc.)
- Dai massimo 3-4 consigli concreti e attuabili
- Usa i dati reali del ristorante nella risposta
- Se hai materiali di consulenza, applica quello stile e metodologia
- Formato: testo fluido, breve, professionale`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const avgFc = menus.length > 0
        ? menus.reduce((s: number, m: any) => s + parseFloat(m.fc_pct || 0), 0) / menus.length
        : 0;
      return res.json({
        answer: `Analisi del tuo ristorante basata sui dati reali:\n\n` +
          `📊 **Food Cost medio**: ${avgFc.toFixed(1)}% ${avgFc <= 30 ? '✅ ottimo, sotto il 30%' : '⚠️ alto, target è ≤30%'}.\n\n` +
          `🍽️ **Menu**: ${menus.length} piatti attivi. ${menus.filter((m: any) => parseFloat(m.fc_pct) > 30).length > 0 ? `Attenzione: ${menus.filter((m: any) => parseFloat(m.fc_pct) > 30).map((m: any) => m.piatto).join(', ')} superano il 30% FC.` : 'Tutti i piatti sono sotto il target del 30%.'}` +
          `\n\n💡 **Per attivare Claude AI**: aggiungi la variabile ANTHROPIC_API_KEY nel pannello Railway (servizio backend → Variables).`,
        source: 'local',
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: question || 'Dammi i 3 consigli più importanti per migliorare la redditività del mio ristorante in base ai dati.' }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
    const data: any = await response.json();
    return res.json({ answer: data.content?.[0]?.text || 'Nessuna risposta', source: 'claude' });

  } catch (err: any) {
    console.error('AI suggest error:', err);
    return res.status(500).json({ error: 'Errore nel servizio AI: ' + err.message });
  }
});

export default router;
