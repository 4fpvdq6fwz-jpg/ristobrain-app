import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowRight,
  Check,
  Brain,
  Sparkles,
  MapPin,
  Shield,
  FileText,
  ChefHat,
} from 'lucide-react';
import DemoButton from '@/components/DemoButton';
import LandingFeatures from '@/components/LandingFeatures';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: { 'it-IT': '/', 'en-US': '/en' },
  },
};

const steps = [
  { n: '1', title: 'Inserisci ingredienti e ricette', desc: 'Carica i tuoi ingredienti con i prezzi dei fornitori e componi le ricette dei piatti.' },
  { n: '2', title: 'Aggiungi le vendite', desc: 'Importa o inserisci i dati di vendita per periodo e lascia che RistoBrain faccia i calcoli.' },
  { n: '3', title: 'Ottimizza il menu', desc: 'Leggi food cost, marginalità e quadranti di menu engineering e decidi dove agire.' },
];

const trust = [
  { icon: MapPin, title: '100% italiano', desc: 'Pensato sulla ristorazione italiana, in italiano.' },
  { icon: Shield, title: 'Dati cifrati & GDPR', desc: 'Password cifrate, connessioni protette, dati tuoi.' },
  { icon: FileText, title: 'Conforme allergeni UE', desc: 'I 14 allergeni del Reg. UE 1169/2011.' },
  { icon: ChefHat, title: 'Creato da uno chef', desc: 'Nato in cucina, non a tavolino.' },
];

const plans = [
  { name: 'Free', price: '0€', highlight: false, cta: 'Inizia gratis',
    features: ['1 locale', 'Fino a 30 ricette', 'Fino a 50 ingredienti', 'Caricamento fatture', 'AI Consulente base'] },
  { name: 'Base', price: '19€', highlight: false, cta: 'Scegli Base',
    features: ['1 locale', 'Ricette e ingredienti illimitati', 'Analisi food cost', 'Caricamento fatture (XML/PDF/AI)', 'AI Consulente base'] },
  { name: 'Pro', price: '49€', highlight: true, cta: 'Scegli Pro',
    features: ['Locali illimitati', 'Ricette e ingredienti illimitati', 'Motore Creatività Menu', 'AI Consulente avanzato', 'Menu engineering professionale', 'Supporto prioritario'] },
  { name: 'Business', price: '99€', highlight: false, cta: 'Scegli Business',
    features: ['Tutto del piano Pro', 'Multi-ristorante con team e ruoli', 'Assistenza dedicata via email', 'Accesso anticipato alle novità'] },
];

const faqs = [
  { q: 'Come calcola RistoBrain il food cost?', a: 'Parte dal costo reale degli ingredienti (i prezzi dei tuoi fornitori) e dalle quantità nelle ricette, considerando sprechi e rese. Puoi aggiornare i prezzi anche caricando le fatture.' },
  { q: 'Devo installare qualcosa?', a: 'No. RistoBrain funziona dal browser su qualsiasi dispositivo. Puoi anche installarlo come app (PWA) su telefono e tablet, senza passare da uno store.' },
  { q: 'Posso caricare le fatture dei fornitori?', a: 'Sì. Carichi la fattura elettronica XML oppure un PDF o una foto, e il sistema estrae ingredienti e prezzi in automatico.' },
  { q: 'I miei dati sono al sicuro?', a: 'Sì: password cifrate, connessioni protette e la possibilità di esportare o cancellare i tuoi dati in qualsiasi momento.' },
  { q: 'Posso provarlo gratis?', a: 'Sì, esiste un piano gratuito senza carta di credito. Puoi anche provare subito la demo con dati di esempio.' },
  { q: 'Come funziona il piano Pro?', a: '49€ al mese: locali, ricette e ingredienti illimitati, AI avanzata e supporto prioritario. Puoi disdire quando vuoi.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-white" style={{backgroundImage:'radial-gradient(1100px 520px at 85% -10%, rgba(255,107,53,0.07), transparent), radial-gradient(900px 480px at -5% 40%, rgba(91,141,239,0.05), transparent)'}}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1115]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Brain className="text-orange-500" size={22} />
            <span>RistoBrain</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/en" className="px-2 py-2 text-white/60 hover:text-white transition-colors" aria-label="English">EN</Link>
            <a href="#prezzi" className="hidden sm:block px-3 py-2 text-white/80 hover:text-white transition-colors">Prezzi</a>
            <Link href="/login" className="px-3 py-2 text-white/80 hover:text-white transition-colors">Accedi</Link>
            <Link href="/login?tab=register" className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-medium transition-colors">
              Prova gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-6">
          <TrendingUp size={13} /> Food Cost &amp; Menu Engineering per ristoranti
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Il software per calcolare il food cost e aumentare i margini del tuo ristorante
        </h1>
        <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
          RistoBrain calcola in automatico il food cost di ogni piatto, applica il menu engineering
          e ti aiuta a gestire allergeni, scorte e prezzi. Tutto in una sola piattaforma, anche da mobile.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-semibold transition-colors">
            Crea il tuo account gratuito <ArrowRight size={18} />
          </Link>
          <DemoButton />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> Nessuna carta richiesta</span>
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> In italiano</span>
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> Pronto da mobile</span>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-6xl mx-auto px-5 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {trust.map((tr) => (
            <div key={tr.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <tr.icon className="text-orange-400" size={17} />
              </div>
              <div>
                <div className="font-semibold text-sm">{tr.title}</div>
                <div className="text-xs text-white/50 leading-snug mt-0.5">{tr.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features (interactive cards + modal) */}
      <LandingFeatures lang="it" />

      {/* Founder note */}
      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-2 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-5 w-fit">
            <ChefHat size={13} /> Dal fondatore
          </div>
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-white/90">
            «L’ho creato perché in cucina la mole di lavoro spegne la creatività: quando corri tutto il giorno, i piatti nuovi non arrivano e i conti si perdono nei dettagli. RistoBrain tiene sotto controllo i costi e ti aiuta ogni giorno a creare menu e piatti nuovi, soprattutto nei momenti di calo creativo.»
          </p>
          <div className="mt-5 text-sm text-white/60">Davide Massatani — chef e fondatore di RistoBrain</div>
        </div>
      </section>

      {/* Consulente AI */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-4">
              <Sparkles size={13} /> Consulente AI
            </div>
            <h2 className="text-3xl font-bold mb-3">Una consulenza esperta, sempre con te</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              RistoBrain non si ferma ai numeri: analizza i dati reali del tuo ristorante e ti dà consigli concreti
              per abbassare il food cost e aumentare i margini, con l&apos;approccio e la metodologia di un consulente di ristorazione esperto.
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2"><Check size={15} className="text-orange-400 shrink-0" /> Cosa promuovere e cosa togliere dal menu</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-orange-400 shrink-0" /> Dove tagliare i costi senza perdere qualità</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-orange-400 shrink-0" /> Il prezzo giusto per ogni piatto</li>
            </ul>
          </div>
          <div className="w-full md:w-80 shrink-0 rounded-2xl border border-white/10 bg-[#171a21] p-5">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold"><Brain size={16} className="text-orange-400" /> Consulente AI</div>
            <div className="space-y-3 text-sm">
              <div className="ml-6 bg-white/5 rounded-2xl rounded-tr-sm px-3 py-2 text-white/80">Come posso abbassare il food cost?</div>
              <div className="mr-6 bg-orange-500/10 border border-orange-500/15 rounded-2xl rounded-tl-sm px-3 py-2 text-white/80">
                Il tuo food cost medio è 32%. Rivedi il prezzo di 3 piatti e cambia fornitore sulla carne: torni sotto il 30%.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Come funziona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] shadow-[0_6px_18px_rgba(255,107,53,0.3)] text-white font-bold flex items-center justify-center mb-4">{s.n}</div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="prezzi" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Prezzi semplici e trasparenti</h2>
        <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">
          Inizia gratis, cambia piano quando vuoi. Nessun vincolo, disdici quando vuoi.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((p) => (
            <div key={p.name} className={p.highlight
              ? 'rounded-2xl border border-orange-500/50 bg-orange-500/[0.07] shadow-[0_0_48px_rgba(255,107,53,0.10)] p-6 relative'
              : 'rounded-2xl border border-white/10 bg-white/[0.02] p-6 relative'}>
              {p.highlight && (
                <span className="absolute -top-3 left-6 text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-semibold">Consigliato</span>
              )}
              <h3 className="font-bold text-lg">{p.name}</h3>
              <div className="flex items-baseline gap-1 mt-1 mb-5">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-white/50 text-sm">/mese</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check size={15} className={p.highlight ? 'text-orange-400 shrink-0' : 'text-white/40 shrink-0'} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login?tab=register" className={p.highlight
                ? 'block text-center py-2.5 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-semibold text-sm'
                : 'block text-center py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-white/90 font-semibold text-sm transition-colors'}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Domande frequenti</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-semibold mb-2">{f.q}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-500/10 to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold mb-3">Inizia a tagliare gli sprechi oggi</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Bastano pochi minuti per inserire le prime ricette e vedere subito il food cost dei tuoi piatti.
          </p>
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-semibold transition-colors">
            Crea il tuo account gratuito <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold text-white/80">
              <Brain className="text-orange-500" size={18} /> RistoBrain
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
              <Link href="/en" className="hover:text-white transition-colors">English</Link>
              <Link href="/login" className="hover:text-white transition-colors">Accedi</Link>
              <Link href="/login?tab=register" className="hover:text-white transition-colors">Registrati</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/termini" className="hover:text-white transition-colors">Termini</Link>
              <Link href="/cookie" className="hover:text-white transition-colors">Cookie</Link>
            </div>
          </div>
          <p className="text-sm text-white/40 mt-6">
            Software per food cost, menu engineering, allergeni e gestione ristorante.
          </p>
          <p className="text-xs text-white/30 mt-4">
            RistoBrain è un servizio di Accanto di Massatani Davide S.a.s. — P.IVA 04039140548 — Largo Carducci 34, 06034 Foligno (PG) — accanto@accantosas.com
          </p>
          <p className="text-xs text-white/30 mt-2">
            &copy; {new Date().getFullYear()} RistoBrain. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </main>
  );
}
