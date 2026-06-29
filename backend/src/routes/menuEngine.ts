import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();
const MODEL = 'claude-sonnet-4-6';

// ===================== HOUSE RULES (regole della casa) =====================

router.get('/rules', authenticate, async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT id, tipo, contenuto, priorita, attiva, created_at
       FROM house_rules WHERE workspace_id=$1 ORDER BY priorita ASC, created_at ASC`,
      [req.user!.workspaceId]
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/rules', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { tipo, contenuto, priorita = 1, attiva = true } = req.body;
    if (!tipo || !contenuto) return res.status(400).json({ error: 'tipo e contenuto obbligatori' });
    const id = uuidv4();
    await query(
      `INSERT INTO house_rules (id, workspace_id, tipo, contenuto, priorita, attiva, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, req.user!.workspaceId, tipo, contenuto, parseInt(priorita) || 1, attiva !== false, req.user!.userId]
    );
    const created = await queryOne(`SELECT * FROM house_rules WHERE id=$1`, [id]);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/rules/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { tipo, contenuto, priorita, attiva } = req.body;
    await query(
      `UPDATE house_rules SET tipo=$1, contenuto=$2, priorita=$3, attiva=$4
       WHERE id=$5 AND workspace_id=$6`,
      [tipo, contenuto, parseInt(priorita) || 1, attiva !== false, req.params.id, req.user!.workspaceId]
    );
    const updated = await queryOne(`SELECT * FROM house_rules WHERE id=$1 AND workspace_id=$2`, [req.params.id, req.user!.workspaceId]);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/rules/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    await query(`DELETE FROM house_rules WHERE id=$1 AND workspace_id=$2`, [req.params.id, req.user!.workspaceId]);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ===================== REFERENCE MENUS (menu di riferimento) =====================

router.get('/reference-menus', authenticate, async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT id, cliente, formato, contenuto, attiva, created_at
       FROM reference_menus WHERE workspace_id=$1 ORDER BY created_at DESC`,
      [req.user!.workspaceId]
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/reference-menus', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { cliente, formato, contenuto, attiva = true } = req.body;
    if (!contenuto) return res.status(400).json({ error: 'contenuto obbligatorio' });
    const id = uuidv4();
    await query(
      `INSERT INTO reference_menus (id, workspace_id, cliente, formato, contenuto, attiva, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, req.user!.workspaceId, cliente || null, formato || null, contenuto, attiva !== false, req.user!.userId]
    );
    const created = await queryOne(`SELECT * FROM reference_menus WHERE id=$1`, [id]);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/reference-menus/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { cliente, formato, contenuto, attiva } = req.body;
    await query(
      `UPDATE reference_menus SET cliente=$1, formato=$2, contenuto=$3, attiva=$4
       WHERE id=$5 AND workspace_id=$6`,
      [cliente || null, formato || null, contenuto, attiva !== false, req.params.id, req.user!.workspaceId]
    );
    const updated = await queryOne(`SELECT * FROM reference_menus WHERE id=$1 AND workspace_id=$2`, [req.params.id, req.user!.workspaceId]);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/reference-menus/:id', authenticate, requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    await query(`DELETE FROM reference_menus WHERE id=$1 AND workspace_id=$2`, [req.params.id, req.user!.workspaceId]);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ===================== HISTORY (log generazioni) =====================

router.get('/generations', authenticate, async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT id, restaurant_id, brief_input, output, usato_web, model, created_at
       FROM menu_generations WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 30`,
      [req.user!.workspaceId]
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ===================== MOTORE CREATIVITÀ — POST /generate =====================

// Cintura di sicurezza pricing: ogni prezzo deve finire in 7 (es. 9.70 / 12.70 / 16.70)
function roundToSeven(p: number): number {
  if (!isFinite(p) || p <= 0) return 0;
  const euros = Math.max(0, Math.round(p - 0.7));
  return Math.round((euros + 0.7) * 100) / 100;
}

function extractJson(raw: string): any {
  let txt = (raw || '').trim();
  // rimuove eventuali fence ```json ... ```
  txt = txt.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  const start = txt.indexOf('{');
  const end = txt.lastIndexOf('}');
  if (start >= 0 && end > start) txt = txt.slice(start, end + 1);
  return JSON.parse(txt);
}

router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    const {
      restaurant_id,
      tipo_menu,
      stagione,
      piatti_richiesti,
      ticket_target,
      ingredienti,
      usa_web = false,
    } = req.body || {};

    // 1. Contesto ristorante (opzionale)
    let restaurant: any = null;
    if (restaurant_id) {
      restaurant = await queryOne(
        `SELECT id, name, formato, regione, ticket_target, vincoli, cuisine_type, target_fc_default
         FROM locations WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL`,
        [restaurant_id, wsId]
      );
    }

    // 2. Regole della casa + menu di riferimento
    const [rules, refs] = await Promise.all([
      query<any>(`SELECT tipo, contenuto, priorita FROM house_rules WHERE workspace_id=$1 AND attiva=TRUE ORDER BY priorita ASC`, [wsId]),
      query<any>(`SELECT cliente, formato, contenuto FROM reference_menus WHERE workspace_id=$1 AND attiva=TRUE ORDER BY created_at DESC LIMIT 5`, [wsId]),
    ]);

    const usandoDefault = rules.length === 0;

    // 3. Prompt builder
    const rulesText = rules.length > 0
      ? rules.map((r: any) => `- [${r.tipo} · priorità ${r.priorita}] ${r.contenuto}`).join('\n')
      : 'NESSUNA regola della casa definita. Usa default conservativi: food cost verde <28% / giallo 28-35% / rosso >35%; non inventare logiche proprietarie; prezzi con finale 7.';

    const refsText = refs.length > 0
      ? refs.map((m: any) => `### ${m.cliente || '—'} (${m.formato || '—'})\n${m.contenuto}`).join('\n\n')
      : 'Nessun menu di riferimento fornito.';

    const ticket = (ticket_target ?? restaurant?.ticket_target ?? restaurant?.target_fc_default) || '—';
    const ctx = restaurant
      ? `Nome: ${restaurant.name} | Formato: ${restaurant.formato || restaurant.cuisine_type || '—'} | Regione: ${restaurant.regione || '—'} | Ticket target: ${ticket}€ | Vincoli: ${restaurant.vincoli || '—'}`
      : `Nessun ristorante selezionato. Ticket target richiesto: ${ticket}€.`;

    const brief = JSON.stringify({ tipo_menu, stagione, piatti_richiesti, ticket_target: ticket, ingredienti, usa_web }, null, 2);

    const systemPrompt = `Sei il motore creativo di RistoBrain, costruito sulla metodologia del Chef Davide Massatani (Chef del Margine).

GERARCHIA DELLE FONTI (rigida, in ordine):
1. REGOLE DELLA CASA → SEMPRE prioritarie e vincolanti.
2. MENU DI RIFERIMENTO → modello di stile, pricing, razionale.
3. WEB (solo se fornito) → ispirazione marginale su stagionalità/trend; NON può violare le regole della casa.

REGOLE DELLA CASA (vincolanti, in ordine di priorità):
${rulesText}

MENU DI RIFERIMENTO (stile da imitare):
${refsText}

CONTESTO RISTORANTE:
${ctx}

BRIEF RICHIESTO:
${brief}

COMPITO:
Genera un menu coerente con il brief. Per OGNI piatto produci:
nome, descrizione breve, ingredienti_chiave, food_cost_stimato_pct,
prezzo_suggerito (rispetta la regola di pricing: prezzo finisce in 7),
classificazione_abc_attesa (Star/Plow Horse/Puzzle/Dog),
razionale_margine (1 frase), fonte ("logica_casa" oppure "web").

VINCOLI DURI:
- Rispetta ticket target e vincoli di formato (es. no frittura).
- Prezzo di vendita SEMPRE con finale 7.
- Se un'idea (tua o dal web) viola una regola della casa, scartala.
- Stima food cost coerente con le soglie semaforo del Chef.
- Rispondi SOLO con JSON valido. Nessun testo prima/dopo, nessun markdown, nessun commento.

FORMATO OUTPUT (JSON esatto):
{"menu":[{"categoria":"","nome":"","descrizione":"","ingredienti_chiave":[],"food_cost_stimato_pct":0,"prezzo_suggerito":0,"classificazione_abc_attesa":"","razionale_margine":"","fonte":""}],"note_food_cost":"","fonti_usate":[]}`;

    // 4. Chiamata Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Servizio AI non configurato: aggiungi ANTHROPIC_API_KEY nel backend (Railway → Variables).' });
    }

    const body: any = {
      model: MODEL,
      max_tokens: 3500,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Genera il menu richiesto, rispettando le regole della casa. Rispondi SOLO con il JSON.' }],
    };
    if (usa_web) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }];
    }

    let response: globalThis.Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
    } catch (netErr: any) {
      return res.status(502).json({ error: 'Chiamata AI fallita (rete). Riprova tra poco.' });
    }

    if (!response.ok) {
      const t = await response.text().catch(() => '');
      console.error('Anthropic error', response.status, t);
      return res.status(502).json({ error: `Servizio AI non disponibile (${response.status}). Riprova tra poco.` });
    }

    const data: any = await response.json();
    const rawText = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();

    // 5. Parse JSON robusto
    let parsed: any;
    try {
      parsed = extractJson(rawText);
    } catch (parseErr) {
      console.error('JSON parse fail:', rawText.slice(0, 500));
      return res.status(502).json({ error: 'La risposta AI non era un JSON valido. Riprova.' });
    }

    // 6. Cintura di sicurezza pricing (finale 7) + normalizzazione
    const menu = Array.isArray(parsed.menu) ? parsed.menu.map((p: any) => ({
      categoria: p.categoria || '',
      nome: p.nome || '',
      descrizione: p.descrizione || '',
      ingredienti_chiave: Array.isArray(p.ingredienti_chiave) ? p.ingredienti_chiave : [],
      food_cost_stimato_pct: Number(p.food_cost_stimato_pct) || 0,
      prezzo_suggerito: roundToSeven(Number(p.prezzo_suggerito) || 0),
      classificazione_abc_attesa: p.classificazione_abc_attesa || '',
      razionale_margine: p.razionale_margine || '',
      fonte: p.fonte || 'logica_casa',
    })) : [];

    const result = {
      menu,
      note_food_cost: parsed.note_food_cost || '',
      fonti_usate: Array.isArray(parsed.fonti_usate) ? parsed.fonti_usate : ['logica_casa'],
      usando_default: usandoDefault,
    };

    // 7. Log su menu_generations
    try {
      await query(
        `INSERT INTO menu_generations (id, workspace_id, restaurant_id, brief_input, output, usato_web, model, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuidv4(), wsId, restaurant_id || null, JSON.stringify(req.body || {}), JSON.stringify(result), !!usa_web, MODEL, req.user!.userId]
      );
    } catch (logErr) {
      console.error('menu_generations log fail (non bloccante):', logErr);
    }

    return res.json(result);
  } catch (err: any) {
    console.error('genera-menu error:', err);
    return res.status(500).json({ error: 'Errore nel motore creatività: ' + err.message });
  }
});

export default router;
