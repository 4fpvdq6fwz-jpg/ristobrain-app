'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { aiApi } from '@/lib/api';
import toast from 'react-hot-toast';

const SUGGERIMENTI = [
  'Come posso abbassare il food cost?',
  'Quali piatti devo promuovere di più?',
  'I miei prezzi sono giusti?',
  'Cosa mi consigli per aumentare i margini?',
  'Come strutturare un menu più redditizio?',
  'Analizza le mie vendite e dimmi cosa migliorare',
];

export default function AiPage() {
  const [domanda, setDomanda] = useState('');
  const [risposta, setRisposta] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [source, setSource] = useState('');

  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loadingKb, setLoadingKb] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadKnowledge(); }, []);

  const loadKnowledge = async () => {
    try {
      const res = await aiApi.listKnowledge();
      setKnowledge(res.data);
    } catch { /* ignore */ } finally {
      setLoadingKb(false);
    }
  };

  const chiedi = async (q?: string) => {
    const question = q || domanda;
    if (!question.trim()) return;
    setLoadingChat(true);
    setRisposta('');
    setSource('');
    try {
      const res = await aiApi.suggest(question);
      setRisposta(res.data.answer);
      setSource(res.data.source);
    } catch {
      setRisposta('Errore nel servizio AI. Riprova tra un momento.');
    } finally {
      setLoadingChat(false);
    }
  };

  const addKnowledge = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Inserisci titolo e contenuto');
      return;
    }
    setSaving(true);
    try {
      await aiApi.addKnowledge({ title: newTitle, content: newContent });
      toast.success('Materiale aggiunto! L\'AI userà il tuo stile nelle prossime risposte.');
      setNewTitle('');
      setNewContent('');
      setShowAddForm(false);
      await loadKnowledge();
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const deleteKnowledge = async (id: string) => {
    if (!confirm('Eliminare questo materiale dalla knowledge base?')) return;
    try {
      await aiApi.deleteKnowledge(id);
      toast.success('Eliminato');
      setKnowledge(k => k.filter(i => i.id !== id));
    } catch {
      toast.error('Errore');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">🤖 Consulente AI</h1>
          <p className="text-dark-200 text-sm mt-1">
            Consigli personalizzati basati sui tuoi dati reali
            {knowledge.length > 0 && ` · ${knowledge.length} materiali di consulenza caricati`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat AI — 2 colonne */}
          <div className="lg:col-span-2 card-dark">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💬</span>
              <div>
                <h2 className="text-base font-semibold text-white">Chiedi al Consulente</h2>
                <p className="text-xs text-dark-400">Analisi basata sui tuoi dati reali</p>
              </div>
              {source === 'claude' && (
                <span className="ml-auto text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                  ✨ Powered by Claude
                </span>
              )}
              {source === 'local' && (
                <span className="ml-auto text-xs bg-dark-600 text-dark-300 px-2 py-0.5 rounded-full">
                  Analisi locale
                </span>
              )}
            </div>

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
                disabled={loadingChat || !domanda.trim()}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loadingChat ? '...' : 'Chiedi'}
              </button>
            </div>

            {loadingChat && (
              <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2 text-dark-300 text-sm">
                  <span className="animate-pulse">🤔</span>
                  <span>Sto analizzando i tuoi dati{knowledge.length > 0 ? ' e le tue consulenze' : ''}...</span>
                </div>
              </div>
            )}

            {risposta && !loadingChat && (
              <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                <p className="text-sm text-dark-100 whitespace-pre-wrap leading-relaxed">{risposta}</p>
              </div>
            )}
          </div>

          {/* Knowledge Base — 1 colonna */}
          <div className="card-dark">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-white">📚 Le mie consulenze</h2>
                <p className="text-xs text-dark-400 mt-0.5">L'AI impara dal tuo stile</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs px-3 py-1.5 bg-brand-500/20 text-brand-400 rounded-lg hover:bg-brand-500/30 transition-colors font-medium"
              >
                + Aggiungi
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-3 bg-dark-700 rounded-lg space-y-2 border border-dark-500">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Titolo (es. Strategia prezzi, Filosofia menu...)"
                  className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1.5 text-xs text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Incolla qui il testo della tua consulenza, metodologia, linee guida, articoli, schemi di pricing..."
                  rows={6}
                  className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1.5 text-xs text-white placeholder-dark-400 focus:outline-none focus:border-brand-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addKnowledge}
                    disabled={saving}
                    className="flex-1 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs rounded transition-colors font-medium"
                  >
                    {saving ? 'Salvo...' : '💾 Salva'}
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewTitle(''); setNewContent(''); }}
                    className="px-3 py-1.5 text-dark-300 hover:text-white text-xs transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}

            {loadingKb ? (
              <p className="text-xs text-dark-300 text-center py-4">Caricamento...</p>
            ) : knowledge.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📖</p>
                <p className="text-xs text-dark-300 font-medium">Nessun materiale ancora</p>
                <p className="text-xs text-dark-400 mt-1 leading-relaxed">
                  Carica le tue consulenze, metodologie o linee guida per personalizzare le risposte AI al tuo stile professionale.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledge.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 p-2.5 bg-dark-700 rounded-lg border border-dark-600">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-dark-400 mt-0.5 line-clamp-2 leading-relaxed">{item.content}</p>
                    </div>
                    <button
                      onClick={() => deleteKnowledge(item.id)}
                      className="text-dark-500 hover:text-red-400 transition-colors flex-shrink-0 text-xs mt-0.5"
                      title="Elimina"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {knowledge.length > 0 && (
              <p className="text-xs text-dark-400 mt-3 text-center">
                ✅ {knowledge.length} materiale{knowledge.length > 1 ? 'i' : ''} caricato{knowledge.length > 1 ? 'i' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
