'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { aiApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { getAuth } from '@/lib/auth';

const SUGGERIMENTI = [
  'Come posso abbassare il food cost?',
  'Quali piatti devo promuovere di più?',
  'I miei prezzi sono giusti?',
  'Cosa mi consigli per aumentare i margini?',
  'Come strutturare un menu più redditizio?',
  'Analizza le mie vendite e dimmi cosa migliorare',
];

type Msg = { role: 'user' | 'assistant'; content: string; source?: string };

/* Mini renderer markdown (sicuro: testo prima escapato) */
function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  return md.split('\n').map((line) => {
    if (/^#{1,4} /.test(line)) return `<p class="font-bold text-white mt-2 mb-0.5">${inline(line.replace(/^#+ /, ''))}</p>`;
    if (/^[-•*] /.test(line)) return `<p class="pl-4">• ${inline(line.replace(/^[-•*] /, ''))}</p>`;
    if (/^\d+[.)] /.test(line)) return `<p class="pl-4">${inline(line)}</p>`;
    if (line.trim() === '') return '<div class="h-2"></div>';
    return `<p>${inline(line)}</p>`;
  }).join('');
}

export default function AiPage() {
  const [domanda, setDomanda] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [provider, setProvider] = useState('claude');
  const [isAdmin, setIsAdmin] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loadingKb, setLoadingKb] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const role = auth?.workspace?.role;
    const admin = role === 'admin' || role === 'owner';
    setIsAdmin(admin);
    if (admin) loadKnowledge();
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loadingChat]);

  const loadKnowledge = async () => {
    try {
      const res = await aiApi.listKnowledge();
      setKnowledge(res.data);
    } catch { /* ignore */ } finally {
      setLoadingKb(false);
    }
  };

  const chiedi = async (q?: string) => {
    const question = (q || domanda).trim();
    if (!question || loadingChat) return;
    setDomanda('');
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoadingChat(true);
    try {
      const res = await aiApi.suggest(question, provider, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.answer, source: res.data.source }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: 'assistant', content: err?.response?.data?.error || 'Errore nel servizio AI. Riprova tra un momento.', source: 'error' }]);
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

  const sourceLabel = (s?: string) =>
    s === 'claude' ? '✨ Claude' : s === 'chatgpt' ? '✨ ChatGPT' : s === 'local' ? 'Analisi locale' : null;

  const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('title', f.name);
      await aiApi.uploadKnowledgeFile(fd);
      toast.success('Documento caricato e aggiunto al contesto AI');
      loadKnowledge();
    } catch (err: any) {
      toast.error((err && err.response && err.response.data && err.response.data.error) || 'Impossibile caricare il file');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">🤖 Consulente AI</h1>
          <p className="text-dark-200 text-sm mt-1">
            Consigli personalizzati basati sui tuoi dati reali
          </p>
        </div>

        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-4`}>
          {/* Chat AI — 2 colonne */}
          <div className={`${isAdmin ? 'lg:col-span-2' : ''} card-dark flex flex-col`}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xl">💬</span>
              <div>
                <h2 className="text-base font-semibold text-white">Chiedi al Consulente</h2>
                <p className="text-xs text-dark-400">Conversazione basata sui tuoi dati reali</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="text-xs px-2.5 py-1 rounded-lg border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-colors"
                  >
                    ↺ Nuova chat
                  </button>
                )}
                <span className="text-xs text-dark-400">Motore:</span>
                <div className="flex bg-dark-700 rounded-lg p-1 gap-1">
                  {(['claude', 'openai'] as const).map((pv) => (
                    <button key={pv} type="button" onClick={() => setProvider(pv)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${provider === pv ? 'bg-dark-500 text-white' : 'text-dark-300 hover:text-white'}`}>
                      {pv === 'claude' ? 'Claude' : 'ChatGPT'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Area conversazione */}
            <div ref={chatRef} className="overflow-y-auto max-h-[440px] min-h-[120px] space-y-3 mb-4 pr-1">
              {messages.length === 0 && !loadingChat && (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">👨‍🍳</p>
                  <p className="text-sm text-dark-200 font-medium">Fai una domanda o parti da un suggerimento</p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {SUGGERIMENTI.map((s) => (
                      <button
                        key={s}
                        onClick={() => chiedi(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-dark-500 text-dark-200 hover:border-brand-500 hover:text-brand-400 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-brand-500/15 border border-brand-500/25 text-sm text-white">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[92%] px-4 py-3 rounded-2xl rounded-tl-md bg-dark-700 border border-dark-600 text-sm text-dark-100 leading-relaxed">
                      {sourceLabel(m.source) && (
                        <span className="inline-block text-[10.5px] mb-1.5 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 font-medium">
                          {sourceLabel(m.source)}
                        </span>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: mdToHtml(m.content) }} />
                    </div>
                  </div>
                )
              ))}

              {loadingChat && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-dark-700 border border-dark-600 text-sm text-dark-300">
                    <span className="animate-pulse">🤔 Sto analizzando i tuoi dati{knowledge.length > 0 ? ' e le tue consulenze' : ''}...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 mt-auto">
              <input
                type="text"
                value={domanda}
                onChange={(e) => setDomanda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && chiedi()}
                placeholder={messages.length > 0 ? 'Continua la conversazione...' : 'Fai una domanda sul tuo ristorante...'}
                className="flex-1 bg-dark-700 border border-dark-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={() => chiedi()}
                disabled={loadingChat || !domanda.trim()}
                className="px-5 py-2.5 btn-primary text-sm disabled:opacity-40"
              >
                {loadingChat ? '...' : 'Invia'}
              </button>
            </div>
          </div>

          {/* Knowledge Base — 1 colonna */}
          {isAdmin && (
          <div className="card-dark">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-white">📚 Le mie consulenze</h2>
          <div className="mb-3">
            <input ref={fileRef} type="file" onChange={onUploadFile} accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md" className="hidden" />
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg">
              {uploading ? 'Carico...' : 'Carica documento (PDF, Word, Excel, CSV, testo)'}
            </button>
            <p className="text-xs text-gray-500 mt-1">Il testo del file viene aggiunto alle tue consulenze e usato dal Consulente AI come contesto.</p>
          </div>
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
      )}
        </div>
      </div>
    </AppLayout>
  );
}
