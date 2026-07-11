'use client';

import { useEffect, useState } from 'react';
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
  X,
} from 'lucide-react';

type Feat = {
  icon: typeof Calculator;
  title: string;
  desc: string;
  long: string;
  points: string[];
  example: string;
};

type Dict = {
  heading: string;
  sub: string;
  more: string;
  cta: string;
  exampleLabel: string;
  feats: Feat[];
};

const DATA: Record<'it' | 'en', Dict> = {
  it: {
    heading: 'Tutto quello che serve per gestire i costi',
    sub: 'Dalle ricette ai margini: RistoBrain riunisce gli strumenti che un ristoratore usa ogni giorno. Tocca una funzione per l’approfondimento.',
    more: 'Scopri di più',
    cta: 'Provalo gratis',
    exampleLabel: 'Esempio',
    feats: [
      {
        icon: Calculator,
        title: 'Food Cost automatico',
        desc: 'Calcola il costo di ogni piatto partendo dalle ricette e dai prezzi reali dei fornitori, sempre aggiornato.',
        long: 'Ogni ricetta si costruisce come in cucina: ingredienti, quantità, resa e scarto. RistoBrain moltiplica tutto per il prezzo reale del fornitore — aggiornato anche dalle fatture — e ti restituisce il costo esatto del piatto e la percentuale di food cost. Cambi un prezzo e ogni piatto che usa quell’ingrediente si aggiorna da solo.',
        points: [
          'Costo e food cost % di ogni piatto, in tempo reale',
          'Gestione di resa e scarto per un dato veritiero',
          'Prezzi aggiornati automaticamente dalle fatture',
        ],
        example: 'Il guanciale passa da 9€ a 12€/kg: vedi subito quali carbonare sforano il 30% di food cost.',
      },
      {
        icon: TrendingUp,
        title: 'Menu Engineering',
        desc: 'Classifica i piatti nei quadranti Star, Plowhorse, Puzzle e Dog e scopri dove aumentare i margini.',
        long: 'RistoBrain incrocia popolarità (le vendite) e marginalità e posiziona ogni piatto in uno dei quattro quadranti classici del menu engineering, dicendoti in pratica cosa mettere in evidenza e cosa togliere dal menu.',
        points: [
          'Star: vende e rende — proteggilo e valorizzalo',
          'Plowhorse: vende ma rende poco — rivedi porzione o prezzo',
          'Puzzle: rende ma vende poco — spingilo con la carta',
          'Dog: non vende e non rende — valuta di toglierlo',
        ],
        example: 'Scopri che il tuo dolce più amato è un Plowhorse: +1€ di prezzo e recuperi margine senza perdere clienti.',
      },
      {
        icon: ShieldAlert,
        title: 'Allergeni & HACCP',
        desc: 'Gestisci i 14 allergeni per ogni piatto e genera la documentazione a norma in un clic.',
        long: 'Assegni i 14 allergeni previsti dal Reg. UE 1169/2011 una volta sola a livello di ingrediente: RistoBrain li propaga a ogni piatto che li contiene e genera la scheda allergeni pronta da esporre o stampare. Niente più tabelle rifatte a mano a ogni cambio di ricetta.',
        points: [
          'I 14 allergeni del Reg. UE 1169/2011',
          'Propagazione automatica ingrediente → piatto',
          'Scheda allergeni pronta da stampare o esporre',
        ],
        example: 'Aggiungi “frutta a guscio” a un pesto: tutti i piatti che lo usano si aggiornano da soli, sei sempre a norma.',
      },
      {
        icon: PackageX,
        title: 'Scorte & Ordini',
        desc: 'Tieni sotto controllo le giacenze e ricevi la lista di riordino divisa per fornitore.',
        long: 'Imposti giacenze e soglie minime; quando un ingrediente scende sotto soglia RistoBrain prepara la lista di riordino già divisa per fornitore. Meno sprechi, meno “proprio stasera mancava”, ordini più veloci.',
        points: [
          'Soglie minime personalizzabili per ingrediente',
          'Lista di riordino divisa per fornitore',
          'Meno sprechi e meno rotture di stock',
        ],
        example: 'Venerdì sera la mozzarella è sotto soglia: la trovi già nella lista del caseificio, pronta da ordinare.',
      },
      {
        icon: Bell,
        title: 'Avvisi prezzi',
        desc: 'Ti avvisiamo quando il prezzo di un ingrediente sale e intacca la marginalità dei tuoi piatti.',
        long: 'RistoBrain tiene d’occhio i prezzi dei tuoi ingredienti — anche leggendo le fatture che carichi — e ti avvisa quando un rincaro intacca il margine di un piatto. Sai subito dove ritoccare il prezzo o cambiare fornitore, prima di perderci.',
        points: [
          'Monitoraggio prezzi anche dalle fatture caricate',
          'Avviso quando il margine di un piatto scende',
          'Reagisci prima di erodere il profitto',
        ],
        example: 'L’olio EVO rincara del 20%: ricevi l’avviso e capisci quali piatti vanno riprezzati.',
      },
      {
        icon: Smartphone,
        title: 'Mobile & PWA',
        desc: 'Usa RistoBrain da telefono, tablet o computer. Installa l’app sul tuo dispositivo senza store.',
        long: 'RistoBrain funziona dal browser su telefono, tablet e computer e si installa come app (PWA) senza passare dagli store. Controlli food cost e margini anche in sala o al mercato, con i dati sempre sincronizzati.',
        points: [
          'Funziona su telefono, tablet e computer',
          'Installabile come app (PWA), senza store',
          'Dati sincronizzati su tutti i dispositivi',
        ],
        example: 'Al mercato controlli al volo se il prezzo del pesce di oggi tiene il margine del piatto del giorno.',
      },
    ],
  },
  en: {
    heading: 'Everything you need to control your costs',
    sub: 'From recipes to margins: RistoBrain brings together the tools a restaurateur uses every day. Tap a feature to learn more.',
    more: 'Learn more',
    cta: 'Try it free',
    exampleLabel: 'Example',
    feats: [
      {
        icon: Calculator,
        title: 'Automatic Food Cost',
        desc: 'Calculates the cost of every dish from your recipes and real supplier prices, always up to date.',
        long: 'Each recipe is built like in the kitchen: ingredients, quantities, yield and waste. RistoBrain multiplies everything by the real supplier price — kept up to date from your invoices too — and gives you the exact dish cost and food cost percentage. Change one price and every dish using that ingredient updates itself.',
        points: [
          'Cost and food cost % of every dish, in real time',
          'Yield and waste handling for a truthful figure',
          'Prices updated automatically from invoices',
        ],
        example: 'Guanciale goes from €9 to €12/kg: instantly see which carbonaras exceed 30% food cost.',
      },
      {
        icon: TrendingUp,
        title: 'Menu Engineering',
        desc: 'Sorts dishes into Star, Plowhorse, Puzzle and Dog quadrants so you know where to grow margins.',
        long: 'RistoBrain crosses popularity (sales) with profitability and places every dish into one of the four classic menu-engineering quadrants, telling you in practice what to highlight and what to drop from the menu.',
        points: [
          'Star: sells and earns — protect and promote it',
          'Plowhorse: sells but low margin — rework portion or price',
          'Puzzle: high margin but low sales — push it on the menu',
          'Dog: low sales and low margin — consider removing it',
        ],
        example: 'You find your best-loved dessert is a Plowhorse: +€1 recovers margin without losing customers.',
      },
      {
        icon: ShieldAlert,
        title: 'Allergens & HACCP',
        desc: 'Manage the 14 allergens for every dish and generate compliant documentation in one click.',
        long: 'Assign the 14 allergens required by EU Reg. 1169/2011 once at the ingredient level: RistoBrain propagates them to every dish that contains them and generates an allergen sheet ready to display or print. No more redoing tables by hand at every recipe change.',
        points: [
          'The 14 allergens of EU Reg. 1169/2011',
          'Automatic ingredient → dish propagation',
          'Allergen sheet ready to print or display',
        ],
        example: 'Add “tree nuts” to a pesto: every dish using it updates itself, so you stay compliant.',
      },
      {
        icon: PackageX,
        title: 'Stock & Orders',
        desc: 'Keep inventory under control and get a reorder list split by supplier.',
        long: 'Set stock levels and minimum thresholds; when an ingredient drops below its threshold RistoBrain prepares the reorder list already split by supplier. Less waste, fewer “we ran out tonight” moments, faster ordering.',
        points: [
          'Custom minimum thresholds per ingredient',
          'Reorder list split by supplier',
          'Less waste and fewer stockouts',
        ],
        example: 'Friday night the mozzarella is below threshold: it is already on the dairy’s list, ready to order.',
      },
      {
        icon: Bell,
        title: 'Price Alerts',
        desc: 'We alert you when an ingredient price rises and eats into your dish margins.',
        long: 'RistoBrain watches your ingredient prices — reading the invoices you upload too — and alerts you when an increase eats into a dish’s margin. You instantly know where to adjust price or switch supplier, before it costs you.',
        points: [
          'Price monitoring, including from uploaded invoices',
          'Alert when a dish margin drops',
          'React before profit is eroded',
        ],
        example: 'Extra-virgin olive oil rises 20%: you get the alert and see which dishes need repricing.',
      },
      {
        icon: Smartphone,
        title: 'Mobile & PWA',
        desc: 'Use RistoBrain on phone, tablet or computer. Install the app on your device, no store needed.',
        long: 'RistoBrain runs in the browser on phone, tablet and computer and installs as an app (PWA) without going through the stores. Check food cost and margins from the floor or at the market, with data always in sync.',
        points: [
          'Works on phone, tablet and computer',
          'Installable as an app (PWA), no store',
          'Data synced across all devices',
        ],
        example: 'At the market you quickly check whether today’s fish price keeps the special’s margin.',
      },
    ],
  },
};

export default function LandingFeatures({ lang = 'it' }: { lang?: 'it' | 'en' }) {
  const t = DATA[lang];
  const [open, setOpen] = useState<number | null>(null);
  const active = open === null ? null : t.feats[open];

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <section className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="text-3xl font-bold text-center mb-3">{t.heading}</h2>
      <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">{t.sub}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {t.feats.map((f, i) => (
          <button
            key={f.title}
            onClick={() => setOpen(i)}
            aria-label={`${f.title} – ${t.more}`}
            className="group text-left rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-orange-500/40 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-500/5 border border-orange-500/20 flex items-center justify-center mb-4">
              <f.icon className="text-orange-400" size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-400 opacity-80 group-hover:opacity-100 group-hover:gap-2 transition-all">
              {t.more} <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#171a21] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
          >
            <button
              onClick={() => setOpen(null)}
              aria-label="Chiudi"
              className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/25 to-orange-500/5 border border-orange-500/20 flex items-center justify-center mb-5">
              <active.icon className="text-orange-400" size={26} />
            </div>

            <h3 className="text-2xl font-bold mb-3 pr-8">{active.title}</h3>
            <p className="text-white/70 leading-relaxed mb-5">{active.long}</p>

            <ul className="space-y-2 mb-5">
              {active.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-white/75">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" /> {p}
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.06] px-4 py-3 text-sm text-white/80 mb-6">
              <span className="font-semibold text-orange-300">{t.exampleLabel}: </span>
              {active.example}
            </div>

            <Link
              href="/login?tab=register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-semibold text-sm"
            >
              {t.cta} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
