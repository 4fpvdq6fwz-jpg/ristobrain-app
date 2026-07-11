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
import LandingFeatures from '@/components/LandingFeatures';

const SITE_URL = 'https://app.ristobrain.com';

export const metadata: Metadata = {
  title: 'RistoBrain — Food Cost & Menu Engineering Software for Restaurants',
  description:
    'RistoBrain helps restaurants calculate food cost, run menu engineering, manage allergens, stock and price alerts. Boost your margins in one platform.',
  alternates: {
    canonical: '/en',
    languages: { 'it-IT': '/', 'en-US': '/en' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/en`,
    siteName: 'RistoBrain',
    title: 'RistoBrain — Food Cost & Menu Engineering Software',
    description:
      'Calculate food cost, optimize your menu with menu engineering and manage allergens, stock and prices. One platform for restaurateurs.',
  },
};

const steps = [
  { n: '1', title: 'Add ingredients and recipes', desc: 'Load your ingredients with supplier prices and build the recipes for your dishes.' },
  { n: '2', title: 'Add your sales', desc: 'Import or enter sales data per period and let RistoBrain crunch the numbers.' },
  { n: '3', title: 'Optimize your menu', desc: 'Read food cost, margins and menu engineering quadrants and decide where to act.' },
];

const trust = [
  { icon: MapPin, title: 'Made in Italy', desc: 'Built around Italian hospitality.' },
  { icon: Shield, title: 'Encrypted & GDPR', desc: 'Encrypted passwords, secure connections, your data.' },
  { icon: FileText, title: 'EU allergen compliant', desc: 'The 14 allergens of EU Reg. 1169/2011.' },
  { icon: ChefHat, title: 'Built by a chef', desc: 'Born in the kitchen, not at a desk.' },
];

const plans = [
  { name: 'Free', price: '€0', highlight: false, cta: 'Start for free',
    features: ['1 location', 'Up to 30 recipes', 'Up to 50 ingredients', 'Invoice upload', 'Basic AI advisor'] },
  { name: 'Base', price: '€19', highlight: false, cta: 'Choose Base',
    features: ['1 location', 'Unlimited recipes and ingredients', 'Food cost analytics', 'Invoice upload (XML/PDF/AI)', 'Basic AI advisor'] },
  { name: 'Pro', price: '€49', highlight: true, cta: 'Choose Pro',
    features: ['Unlimited locations', 'Unlimited recipes and ingredients', 'Creative Menu Engine', 'Advanced AI advisor', 'Professional menu engineering', 'Priority support'] },
  { name: 'Business', price: '€99', highlight: false, cta: 'Choose Business',
    features: ['Everything in Pro', 'Multi-restaurant with team & roles', 'Dedicated email support', 'Early access to new features'] },
];

const faqs = [
  { q: 'How does RistoBrain calculate food cost?', a: 'It starts from the real cost of ingredients (your supplier prices) and the quantities in your recipes, accounting for waste and yield. You can also update prices by uploading invoices.' },
  { q: 'Do I need to install anything?', a: 'No. RistoBrain runs in the browser on any device. You can also install it as an app (PWA) on phone and tablet, without an app store.' },
  { q: 'Can I upload supplier invoices?', a: 'Yes. Upload the electronic XML invoice or a PDF or photo, and the system extracts ingredients and prices automatically.' },
  { q: 'Is my data safe?', a: 'Yes: encrypted passwords, secure connections and the ability to export or delete your data at any time.' },
  { q: 'Can I try it for free?', a: 'Yes, there is a free plan with no credit card required. You can also try the live demo with sample data right away.' },
  { q: 'How does the Pro plan work?', a: '49€ per month: unlimited locations, recipes and ingredients, advanced AI and priority support. Cancel anytime.' },
];

export default function HomeEn() {
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
            <Link href="/" className="px-2 py-2 text-white/60 hover:text-white transition-colors" aria-label="Italiano">IT</Link>
            <a href="#pricing" className="hidden sm:block px-3 py-2 text-white/80 hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="px-3 py-2 text-white/80 hover:text-white transition-colors">Sign in</Link>
            <Link href="/login?tab=register" className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-medium transition-colors">
              Try for free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-6">
          <TrendingUp size={13} /> Food Cost &amp; Menu Engineering for restaurants
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          The software to calculate food cost and grow your restaurant margins
        </h1>
        <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
          RistoBrain automatically calculates the food cost of every dish, applies menu engineering
          and helps you manage allergens, stock and prices. All in one platform, even on mobile.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-semibold transition-colors">
            Create your free account <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 hover:border-white/30 text-white/90 font-semibold transition-colors">
            Sign in
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> No card required</span>
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> Ready in minutes</span>
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-orange-400" /> Works on mobile</span>
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
      <LandingFeatures lang="en" />

      {/* Founder note */}
      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-2 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-5 w-fit">
            <ChefHat size={13} /> From the founder
          </div>
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-white/90">
            “I built it because in the kitchen margin is lost in the details: a price that goes up, a
            wrong portion, a dish that doesn’t pay. RistoBrain keeps it all under control for you.”
          </p>
          <div className="mt-5 text-sm text-white/60">Davide Massatani — chef and founder of RistoBrain</div>
        </div>
      </section>

      {/* AI Advisor */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-4">
              <Sparkles size={13} /> AI Advisor
            </div>
            <h2 className="text-3xl font-bold mb-3">Expert advice, always by your side</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              RistoBrain goes beyond numbers: it analyzes your restaurant&apos;s real data and gives concrete advice
              to lower food cost and grow margins, with the approach and methodology of an experienced restaurant consultant.
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2"><Check size={15} className="text-orange-400 shrink-0" /> What to promote and what to drop from the menu</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-orange-400 shrink-0" /> Where to cut costs without losing quality</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-orange-400 shrink-0" /> The right price for every dish</li>
            </ul>
          </div>
          <div className="w-full md:w-80 shrink-0 rounded-2xl border border-white/10 bg-[#171a21] p-5">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold"><Brain size={16} className="text-orange-400" /> AI Advisor</div>
            <div className="space-y-3 text-sm">
              <div className="ml-6 bg-white/5 rounded-2xl rounded-tr-sm px-3 py-2 text-white/80">How can I lower my food cost?</div>
              <div className="mr-6 bg-orange-500/10 border border-orange-500/15 rounded-2xl rounded-tl-sm px-3 py-2 text-white/80">
                Your average food cost is 32%. Adjust the price of 3 dishes and switch your meat supplier: you get back under 30%.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
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
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Simple, transparent pricing</h2>
        <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">
          Start for free, switch plans anytime. No lock-in, cancel anytime.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((p) => (
            <div key={p.name} className={p.highlight
              ? 'rounded-2xl border border-orange-500/50 bg-orange-500/[0.07] shadow-[0_0_48px_rgba(255,107,53,0.10)] p-6 relative'
              : 'rounded-2xl border border-white/10 bg-white/[0.02] p-6 relative'}>
              {p.highlight && (
                <span className="absolute -top-3 left-6 text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-semibold">Most popular</span>
              )}
              <h3 className="font-bold text-lg">{p.name}</h3>
              <div className="flex items-baseline gap-1 mt-1 mb-5">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-white/50 text-sm">/month</span>
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
        <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
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
          <h2 className="text-3xl font-bold mb-3">Start cutting waste today</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            It takes just a few minutes to add your first recipes and instantly see the food cost of your dishes.
          </p>
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f25c26] hover:brightness-110 shadow-[0_6px_18px_rgba(255,107,53,0.3)] hover:-translate-y-px transition-all font-semibold transition-colors">
            Create your free account <ArrowRight size={18} />
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
              <Link href="/" className="hover:text-white transition-colors">Italiano</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/login?tab=register" className="hover:text-white transition-colors">Sign up</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/termini" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-sm text-white/40 mt-6">
            Software for food cost, menu engineering, allergens and restaurant management.
          </p>
          <p className="text-xs text-white/30 mt-4">
            RistoBrain is a service of Accanto di Massatani Davide S.a.s. — VAT 04039140548 — Largo Carducci 34, 06034 Foligno (PG), Italy — accanto@accantosas.com
          </p>
          <p className="text-xs text-white/30 mt-2">
            &copy; {new Date().getFullYear()} RistoBrain. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
