'use client';

import { useState } from 'react';
import api from '@/lib/api';

const SUGGERIMENTI = [
  'Come posso abbassare il food cost?',
  'Quali piatti devo promuovere di più?',
  'I miei prezzi sono giusti?',
  'Cosa mi consigli per aumentare i margini?',
];

export default function AiAssistant() {
  const [domanda, setDomanda] = useState('');
  const [risposta, setRisposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');

  const chiedi = async (q?: string) => {
    const question = q || domanda;
    if (!question.trim()) return;
    setLoading(true);
    setRisposta('');
    setSource('');
    try {
      const res = await api.post('/ai/suggest', { question });
      setRisposta(res.data.answer);
      setSource(res.data.source);
    } catch {
      setRisposta('Errore nel servizio AI. Riprova tra un momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-dark mt-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="text-base font-semibold text-white">Assistente AI</h2>
          <p className="text-xs text-dark-300">Consigli personalizzati basati sui tuoi dati reali</p>
        </div>
        {source === 'claude' && (
          <span className="ml-auto text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
            Powered by Claude
          </span>
        )}
      </div>

      {/* Domande suggerite */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGERIMENTI.map((s) => (
          <button
            key={s}
            onClick={() => { setDomanda(s); chiedi(s); }}
            className="text-xs px-3 py-1.5 rounded-full border border-dark-500 text-dark-200 hover:border-brand-500 hover:text-brand-400 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={domanda}
          onChange={(e) => setDomanda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && chiedi()}
          placeholder="Fai una domanda sul tuo ristorante..."
          className="flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
        />
        <button
          onClick={() => chiedi()}
          disabled={loading || !domanda.trim()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? '...' : 'Chiedi'}
        </button>
      </div>

      {/* Risposta */}
      {loading && (
        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
          <div className="flex items-center gap-2 text-dark-300 text-sm">
            <span className="animate-pulse">🤔</span>
            <span>Sto analizzando i tuoi dati...</span>
          </div>
        </div>
      )}

      {risposta && !loading && (
        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
          <p className="text-sm text-dark-100 whitespace-pre-wrap leading-relaxed">{risposta}</p>
        </div>
      )}
    </div>
  );
}
