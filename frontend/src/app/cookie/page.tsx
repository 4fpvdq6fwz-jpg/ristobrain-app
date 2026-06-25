import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Come RistoBrain utilizza cookie e tecnologie simili.',
  alternates: { canonical: '/cookie' },
};

const updated = 'Giugno 2026';

const sections: { title: string; body: string[] }[] = [
  {
    title: '1. Cosa sono i cookie',
    body: [
      'I cookie e le tecnologie simili (come il local storage del browser) sono piccoli file o dati salvati sul tuo dispositivo che permettono al servizio di funzionare e di ricordare alcune informazioni tra una visita e l altra.',
    ],
  },
  {
    title: '2. Cookie tecnici necessari',
    body: [
      'Utilizziamo tecnologie strettamente necessarie al funzionamento del servizio: ad esempio per mantenere attiva la tua sessione dopo il login e per ricordare le tue preferenze di base. Senza questi elementi il servizio non puo funzionare, quindi non richiedono consenso.',
    ],
  },
  {
    title: '3. Cookie di misurazione e statistici',
    body: [
      'Possiamo utilizzare strumenti di misurazione anonima per capire come viene usato il servizio e migliorarlo. Questi strumenti vengono attivati solo dopo il tuo consenso tramite il banner cookie.',
    ],
  },
  {
    title: '4. Cookie di terze parti',
    body: [
      'Alcune funzioni si appoggiano a fornitori esterni che possono impostare cookie propri: in particolare Stripe per la gestione sicura dei pagamenti. Ti invitiamo a consultare anche le informative di questi fornitori.',
    ],
  },
  {
    title: '5. Gestione del consenso',
    body: [
      'Al primo accesso ti mostriamo un banner per accettare o rifiutare i cookie non necessari. Puoi modificare la tua scelta in qualsiasi momento cancellando i dati del sito dal tuo browser.',
    ],
  },
  {
    title: '6. Come disabilitare i cookie dal browser',
    body: [
      'Puoi gestire o eliminare i cookie direttamente dalle impostazioni del tuo browser. La disattivazione dei cookie tecnici puo pero compromettere il funzionamento del servizio, ad esempio impedendo il login.',
    ],
  },
];

export default function CookiePage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Brain className="text-orange-500" size={20} /> RistoBrain
          </Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-white/50 text-sm mb-10">Ultimo aggiornamento: {updated}</p>

        {sections.map((s) => (
          <section key={s.title} className="mb-8">
            <h2 className="text-lg font-semibold mb-3">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-white/70 leading-relaxed mb-3">{p}</p>
            ))}
          </section>
        ))}

        <div className="mt-10 pt-6 border-t border-white/10 text-sm text-white/50">
          Vedi anche: <Link href="/privacy" className="text-orange-400 hover:underline">Privacy Policy</Link>
          {' '}e{' '}
          <Link href="/termini" className="text-orange-400 hover:underline">Termini di Servizio</Link>.
        </div>
      </article>
    </main>
  );
}
