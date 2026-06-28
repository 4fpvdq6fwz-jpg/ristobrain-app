'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useLang } from './LanguageProvider';

export default function AiAssistant() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [domanda, setDomanda] = useState('');
  const [risposta, setRisposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');

  const suggerimenti = en
    ? [
        'How can I lower my food cost?',
        'Which dishes should I promote more?',
        'Are my prices right?',
        'What do you suggest to grow my margins?',
      ]
    : [
        'Come posso abbassare il food cost?',
        'Quali piatti devo promuovere di più?',
        'I miei prezzi sono giusti?',
        'Cosa mi consigli per aumentare i margini?',
      ];

  const chiedi = async (q?: string) => {
    const base = (q || domanda).trim();
    if (!base) return;
    const question = en ? `${base}\n\n(Please answer in English.)` : base;
    setLoading(true);
    setRisposta('');
    setSource('');
    try {
      const res = await api.post('/ai/suggest', { question });
      setRisposta(res.data.answer);
      setSource(res.data.source);
    } catch {
      setRisposta(en ? 'AI service error. Please try again in a moment.' : 'Errore nel servizio AI. Riprova tra un momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-dark mt-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="text-base font-semibold text-white">{en ? 'AI Advisor' : 'Assistente AI'}</h2>
          <p className="text-xs text-dark-300">{en ? 'Personalized advice based on your real data' : 'Consigli personalizzati basati sui tuoi dati reali'}</p>
        </div>
        {source === 'claude' && (
          <span className="ml-auto text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
            Powered by Claude
          </span>
        )}
      </div>

      {/* Domande suggerite */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggerimenti.map((s) => (
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
          placeholder={en ? 'Ask a question about your restaurant...' : 'Fai una domanda sul tuo ristorante...'}
          className="flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
        />
        <button
          onClick={() => chiedi()}
          disabled={loading || !domanda.trim()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? '...' : (en ? 'Ask' : 'Chiedi')}
        </button>
      </div>

      {/* Risposta */}
      {loading && (
        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
          <div className="flex items-center gap-2 text-dark-300 text-sm">
            <span className="animate-pulse">🤔</span>
            <span>{en ? 'Analyzing your data...' : 'Sto analizzando i tuoi dati...'}</span>
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
