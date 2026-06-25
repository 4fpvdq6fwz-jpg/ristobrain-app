import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termini di Servizio',
  description: 'Termini e condizioni di utilizzo del servizio RistoBrain.',
  alternates: { canonical: '/termini' },
};

const updated = 'Giugno 2026';

const sections: { title: string; body: string[] }[] = [
  {
    title: '1. Oggetto',
    body: [
      'RistoBrain e un servizio software in cloud che aiuta i ristoratori a calcolare il food cost, analizzare il menu (menu engineering), gestire allergeni, scorte, prezzi e a caricare le fatture dei fornitori. Utilizzando il servizio accetti questi Termini.',
    ],
  },
  {
    title: '2. Account',
    body: [
      'Per usare il servizio devi creare un account fornendo dati veri e aggiornati. Sei responsabile della riservatezza delle tue credenziali e di tutte le attivita svolte con il tuo account. Un account e personale e non puo essere condiviso tra piu persone.',
    ],
  },
  {
    title: '3. Uso consentito',
    body: [
      'Ti impegni a usare RistoBrain nel rispetto della legge e a non tentare di comprometterne la sicurezza, copiarlo, rivenderlo o utilizzarlo per scopi illeciti. Possiamo sospendere gli account che violano queste regole.',
    ],
  },
  {
    title: '4. Piani, prezzi e pagamenti',
    body: [
      'Il servizio puo prevedere un piano gratuito e piani a pagamento. I pagamenti sono gestiti dal fornitore Stripe. Gli abbonamenti si rinnovano automaticamente alla scadenza salvo disdetta, che puoi effettuare in qualsiasi momento dalle impostazioni; il servizio resta attivo fino al termine del periodo gia pagato.',
      'I prezzi possono variare: eventuali modifiche saranno comunicate in anticipo e si applicheranno dal rinnovo successivo.',
    ],
  },
  {
    title: '5. I tuoi contenuti',
    body: [
      'I dati che inserisci (ingredienti, ricette, menu, fatture, vendite) restano di tua proprieta. Ci concedi solo il diritto di trattarli per erogarti il servizio. Puoi esportarli o cancellarli in qualsiasi momento dalle impostazioni.',
    ],
  },
  {
    title: '6. Disponibilita del servizio',
    body: [
      'Lavoriamo per mantenere il servizio disponibile e affidabile, ma non possiamo garantire un funzionamento ininterrotto e privo di errori. Potremmo effettuare manutenzioni o aggiornamenti che comportano brevi interruzioni.',
    ],
  },
  {
    title: '7. Limitazione di responsabilita',
    body: [
      'RistoBrain e uno strumento di supporto alle decisioni. I calcoli e i suggerimenti, inclusi quelli generati dall intelligenza artificiale e dalla lettura delle fatture, vanno sempre verificati. Non siamo responsabili per decisioni commerciali prese sulla base dei dati elaborati, nei limiti consentiti dalla legge.',
    ],
  },
  {
    title: '8. Recesso e cessazione',
    body: [
      'Puoi chiudere il tuo account in qualsiasi momento. Possiamo sospendere o chiudere un account in caso di violazione di questi Termini. Alla cessazione, i dati saranno trattati come indicato nella Privacy Policy.',
    ],
  },
  {
    title: '9. Modifiche ai Termini',
    body: [
      'Possiamo aggiornare questi Termini nel tempo. In caso di modifiche rilevanti te ne daremo avviso. L uso continuato del servizio dopo le modifiche ne comporta l accettazione.',
    ],
  },
  {
    title: '10. Legge applicabile',
    body: [
      'Questi Termini sono regolati dalla legge italiana. Per le controversie e competente il foro del luogo in cui ha sede il Titolare, fatti salvi i diritti inderogabili del consumatore.',
    ],
  },
];

export default function TerminiPage() {
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
        <h1 className="text-3xl font-bold mb-2">Termini di Servizio</h1>
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
          <Link href="/cookie" className="text-orange-400 hover:underline">Cookie Policy</Link>.
        </div>
      </article>
    </main>
  );
}
