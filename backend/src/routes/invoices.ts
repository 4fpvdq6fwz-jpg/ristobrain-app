import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { XMLParser } from 'fast-xml-parser';
import { query, withTransaction } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

type ParsedLine = {
  description: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  total: number | null;
};

function num(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bestMatch(desc: string, ingredients: any[]): { id: string; name: string; score: number } | null {
  const dt = normalize(desc).split(' ').filter((w: string) => w.length > 2);
  if (dt.length === 0) return null;
  let best: any = null;
  let bestScore = 0;
  for (let i = 0; i < ingredients.length; i++) {
    const it = normalize(ingredients[i].name).split(' ').filter((w: string) => w.length > 2);
    if (it.length === 0) continue;
    let inter = 0;
    for (let j = 0; j < dt.length; j++) {
      if (it.indexOf(dt[j]) !== -1) inter++;
    }
    const score = inter / Math.min(dt.length, it.length);
    if (score > bestScore) { bestScore = score; best = ingredients[i]; }
  }
  return best && bestScore >= 0.5
    ? { id: best.id, name: best.name, score: Math.round(bestScore * 100) / 100 }
    : null;
}

function parseFatturaPA(xml: string): { supplier: string; date: string | null; lines: ParsedLine[] } {
  const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
  const doc: any = parser.parse(xml);
  const fe: any = doc.FatturaElettronica || doc;
  const header: any = fe.FatturaElettronicaHeader || {};
  const bodyRaw: any = fe.FatturaElettronicaBody;
  const body: any = Array.isArray(bodyRaw) ? bodyRaw[0] : (bodyRaw || {});
  const ana: any = (header.CedentePrestatore && header.CedentePrestatore.DatiAnagrafici && header.CedentePrestatore.DatiAnagrafici.Anagrafica) || {};
  const supplier: string =
    ana.Denominazione ||
    [ana.Nome, ana.Cognome].filter(Boolean).join(' ') ||
    'Fornitore';
  const date: string | null =
    (body.DatiGenerali && body.DatiGenerali.DatiGeneraliDocumento && body.DatiGenerali.DatiGeneraliDocumento.Data) || null;
  let linee: any = (body.DatiBeniServizi && body.DatiBeniServizi.DettaglioLinee) || [];
  if (!Array.isArray(linee)) linee = [linee];
  const lines: ParsedLine[] = linee
    .map((l: any) => ({
      description: String((l && l.Descrizione) != null ? l.Descrizione : '').trim(),
      quantity: num(l && l.Quantita),
      unit: l && l.UnitaMisura ? String(l.UnitaMisura) : '',
      unitPrice: num(l && l.PrezzoUnitario),
      total: num(l && l.PrezzoTotale),
    }))
    .filter((l: ParsedLine) => l.description.length > 0);
  return { supplier: String(supplier), date, lines };
}

async function parseWithAI(file: any): Promise<{ supplier: string; date: string | null; lines: ParsedLine[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Estrazione AI non disponibile: manca ANTHROPIC_API_KEY. Carica una fattura XML (fattura elettronica) oppure aggiungi la chiave su Railway.');
  }
  const b64 = file.buffer.toString('base64');
  const isPdf = (file.mimetype || '').includes('pdf') || (file.originalname || '').toLowerCase().endsWith('.pdf');
  const mediaBlock: any = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: file.mimetype || 'image/jpeg', data: b64 } };
  const instruction =
    'Estrai le righe di prodotto da questa fattura di un fornitore alimentare. ' +
    'Rispondi SOLO con JSON valido, senza testo prima o dopo, nel formato esatto: ' +
    '{"supplier": string, "date": "YYYY-MM-DD" oppure null, "lines": [{"description": string, "quantity": number oppure null, "unit": string, "unitPrice": number oppure null}]}. ' +
    'unitPrice e il prezzo unitario netto (senza IVA). Includi solo prodotti e ingredienti; escludi trasporto, IVA, bolli, sconti e totali.';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: [mediaBlock, { type: 'text', text: instruction }] }],
    }),
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error('Errore servizio AI ' + response.status + ': ' + t.slice(0, 200));
  }
  const data: any = await response.json();
  let text: string = (data && data.content && data.content[0] && data.content[0].text) || '{}';
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s >= 0 && e > s) text = text.slice(s, e + 1);
  const parsed: any = JSON.parse(text);
  const lines: ParsedLine[] = Array.isArray(parsed.lines)
    ? parsed.lines
        .map((l: any) => ({
          description: String((l && l.description) != null ? l.description : '').trim(),
          quantity: num(l && l.quantity),
          unit: l && l.unit ? String(l.unit) : '',
          unitPrice: num(l && l.unitPrice),
          total: null,
        }))
        .filter((l: ParsedLine) => l.description.length > 0)
    : [];
  return { supplier: String(parsed.supplier || 'Fornitore'), date: parsed.date || null, lines };
}

// POST /invoices/parse — legge la fattura (XML o PDF/foto), NON scrive nulla
router.post('/parse', authenticate, requireRoles('owner', 'admin', 'manager'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file: any = (req as any).file;
    if (!file) return res.status(400).json({ error: 'Nessun file caricato' });
    const fname = (file.originalname || '').toLowerCase();
    const isXml = fname.endsWith('.xml') || (file.mimetype || '').includes('xml');
    const parsed = isXml ? parseFatturaPA(file.buffer.toString('utf-8')) : await parseWithAI(file);

    const ingredients = await query<any>(
      'SELECT id, name, purchase_unit FROM ingredients WHERE workspace_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.user!.workspaceId]
    );
    const lines = parsed.lines.map((l: ParsedLine) => {
      const m = bestMatch(l.description, ingredients as any[]);
      return {
        ...l,
        suggestedIngredientId: m ? m.id : null,
        suggestedIngredientName: m ? m.name : null,
        matchScore: m ? m.score : 0,
      };
    });
    return res.json({ supplier: parsed.supplier, date: parsed.date, source: isXml ? 'xml' : 'ai', lines, ingredients });
  } catch (err: any) {
    console.error('invoice parse error:', err);
    return res.status(500).json({ error: err.message || 'Errore nella lettura della fattura' });
  }
});

// POST /invoices/confirm — applica i prezzi e crea eventuali nuovi ingredienti
router.post('/confirm', authenticate, requireRoles('owner', 'admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    const userId = req.user!.userId;
    const validFrom: string | undefined = req.body && req.body.validFrom;
    const lines: any[] = (req.body && req.body.lines) || [];
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'Nessuna riga da confermare' });
    }
    const vf = validFrom || new Date().toISOString().slice(0, 10);
    let updated = 0;
    let created = 0;
    await withTransaction(async (client) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const price = num(line && line.price);
        if (price == null) continue;
        let ingredientId: string | null = (line && line.ingredientId) || null;
        if (!ingredientId) {
          const newName = String((line && line.name) || '').trim();
          if (!newName) continue;
          const newId = uuidv4();
          await client.query(
            'INSERT INTO ingredients (id, workspace_id, name, purchase_unit, recipe_unit, conversion_factor) VALUES ($1,$2,$3,$4,$5,$6)',
            [newId, wsId, newName, (line && line.purchaseUnit) || 'kg', (line && line.recipeUnit) || 'g', (line && line.conversionFactor) || 1000]
          );
          ingredientId = newId;
          created++;
        } else {
          const own = await client.query(
            'SELECT id FROM ingredients WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL',
            [ingredientId, wsId]
          );
          if (own.rowCount === 0) continue;
          updated++;
        }
        await client.query(
          'INSERT INTO ingredient_prices (ingredient_id, price_per_purchase_unit, valid_from, created_by) VALUES ($1,$2,$3,$4) ON CONFLICT (ingredient_id, valid_from) DO UPDATE SET price_per_purchase_unit = EXCLUDED.price_per_purchase_unit',
          [ingredientId, price, vf, userId]
        );
      }
    });
    return res.json({ ok: true, updated, created });
  } catch (err: any) {
    console.error('invoice confirm error:', err);
    return res.status(500).json({ error: err.message || 'Errore nella conferma' });
  }
});

export default router;
