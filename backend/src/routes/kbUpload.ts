import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { authenticate } from '../middleware/auth';
import { query } from '../db';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const NL = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

function extOf(name: string): string {
  const parts = (name || '').split('.');
  return parts.length > 1 ? String(parts.pop()).toLowerCase() : '';
}

async function extractText(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const ext = extOf(filename);
  const mt = mimetype || '';
  if (['txt', 'md', 'csv', 'tsv', 'json', 'log'].includes(ext) || mt.startsWith('text/')) {
    return buffer.toString('utf-8');
  }
  if (ext === 'pdf' || mt === 'application/pdf') {
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (ext === 'docx' || mt.indexOf('wordprocessingml') !== -1) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  if (['xlsx', 'xls', 'xlsm'].includes(ext) || mt.indexOf('spreadsheet') !== -1 || mt.indexOf('excel') !== -1) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const parts: string[] = [];
    wb.SheetNames.forEach((n) => { parts.push('### ' + n + NL + XLSX.utils.sheet_to_csv(wb.Sheets[n])); });
    return parts.join(NL + NL);
  }
  return '';
}

// POST /api/kb/upload — carica un documento come contesto per il Consulente AI
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId;
    const userId = req.user!.userId;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'Nessun file caricato.' });
    const title = String((req.body && req.body.title) || file.originalname || 'Documento').slice(0, 200);
    let text = '';
    try {
      text = await extractText(file.buffer, file.originalname || '', file.mimetype || '');
    } catch (e: any) {
      console.error('extractText error:', e);
      return res.status(422).json({ error: 'Impossibile leggere il testo da questo file.' });
    }
    text = String(text || '').split(NUL).join('').trim();
    if (!text) return res.status(422).json({ error: 'Nessun testo estraibile. Formati supportati: PDF, Word (.docx), Excel, CSV, testo.' });
    if (text.length > 200000) text = text.slice(0, 200000);
    const rows = await query<any>('INSERT INTO ai_knowledge_base (workspace_id, title, content, source_type, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id', [wsId, title, text, 'upload', userId]);
    return res.status(201).json({ id: rows && rows[0] ? rows[0].id : null, title, chars: text.length });
  } catch (err: any) {
    console.error('kb upload error:', err);
    return res.status(500).json({ error: err.message || 'Errore durante il caricamento.' });
  }
});

export default router;
