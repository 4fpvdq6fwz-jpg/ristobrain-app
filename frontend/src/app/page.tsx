import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator,
  TrendingUp,
  ShieldAlert,
  PackageX,
  Bell,
  Smartphone,
  ArrowRight,
  Check,
  Brain,
} from 'lucide-react';
import AuthRedirect from '@/components/AuthRedirect';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: { 'it-IT': '/', 'en-US': '/en' },
  },
};

const features = [
  {
    icon: Calculator,
    title: 'Food Cost automatico',
    desc: 'Calcola il costo di ogni piatto partendo dalle ricette e dai prezzi reali dei fornitori, sempre aggiornato.',
  },
  {
    icon: TrendingUp,
    title: 'Menu Engineering',
    desc: 'Classifica i piatti nei quadranti Star, Plowhorse, Puzzle e Dog e scopri dove aumentare i margini.',
  },
  {
    icon: ShieldAlert,
    title: 'Allergeni & HACCP',
    desc: 'Gestisci i 14 allergeni per ogni piatto e genera la documentazione a norma in un clic.',
  },
  {
    icon: PackageX,
    title: 'Scorte & Ordini',
    desc: 'Tieni sotto controllo le giacenze e ricevi la lista di riordino divisa per fornitore.',
  },
  {
    icon: Bell,
    title: 'Avvisi prezzi',
    desc: 'Ti avvisiamo quando il prezzo di un ingrediente sale e intacca la marginalita dei tuoi piatti.',
  },
  {
    icon: Smartphone,
    title: 'Mobile & PWA',
    desc: 'Usa RistoBrain da telefono, tablet o computer. Installa la app sul tuo dispositivo senza store.',
  },
];

const steps = [
  { n: '1', title: 'Inserisci ingredienti e ricette', desc: 'Carica i tuoi ingredienti con i prezzi dei fornitori e componi le ricette dei piatti.' },
  { n: '2', title: 'Aggiungi le vendite', desc: 'Importa o inserisci i dati di vendita per periodo e lascia che RistoBrain faccia i calcoli.' },
  { n: '3', title: 'Ottimizza il menu', desc: 'Leggi food cost, marginalita e quadranti di menu engineering e decidi dove agire.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <AuthRedirect />

      {/* Nav */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Brain className="text-orange-500" size={22} />
            <span>RistoBrain</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/en" className="px-2 py-2 text-white/60 hover:text-white transition-colors" aria-label="English">EN</Link>
            <Link href="/login" className="px-3 py-2 text-white/80 hover:text-white transition-colors">
              Accedi
            </Link>
            <Link
              href="/login?tab=register"
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-medium transition-colors"
            >
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
          <Link
            href="/login?tab=register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold transition-colors"
          >
            Crea il tuo account gratuito <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 hover:border-white/30 text-white/90 font-semibold transition-colors"
          >
            Accedi
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> Nessuna carta richiesta</span>
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> In italiano</span>
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> Pronto da mobile</span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Tutto quello che serve per gestire i costi</h2>
        <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">
          Dalle ricette ai margini: RistoBrain riunisce gli strumenti che un ristoratore usa ogni giorno.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-orange-500/30 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                <f.icon className="text-orange-400" size={20} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Come funziona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
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
          <Link
            href="/login?tab=register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold transition-colors"
          >
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
            RistoBrain e un servizio di [Ragione Sociale] - P.IVA [P.IVA] - [Indirizzo] - davide.inchef@gmail.com
          </p>
          <p className="text-xs text-white/30 mt-2">
            &copy; {new Date().getFullYear()} RistoBrain. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </main>
  );
}
