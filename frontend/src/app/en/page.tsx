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

const features = [
  { icon: Calculator, title: 'Automatic Food Cost', desc: 'Calculate the cost of every dish from your recipes and real supplier prices, always up to date.' },
  { icon: TrendingUp, title: 'Menu Engineering', desc: 'Classify dishes into Star, Plowhorse, Puzzle and Dog quadrants and find where to grow your margins.' },
  { icon: ShieldAlert, title: 'Allergens & HACCP', desc: 'Manage the 14 allergens for every dish and generate compliant documentation in one click.' },
  { icon: PackageX, title: 'Stock & Orders', desc: 'Keep your stock under control and get a reorder list grouped by supplier.' },
  { icon: Bell, title: 'Price alerts', desc: 'We alert you when an ingredient price rises and starts eating into your margins.' },
  { icon: Smartphone, title: 'Mobile & PWA', desc: 'Use RistoBrain on your phone, tablet or computer. Install the app on your device without a store.' },
];

const steps = [
  { n: '1', title: 'Add ingredients and recipes', desc: 'Load your ingredients with supplier prices and build the recipes for your dishes.' },
  { n: '2', title: 'Add your sales', desc: 'Import or enter sales data per period and let RistoBrain crunch the numbers.' },
  { n: '3', title: 'Optimize your menu', desc: 'Read food cost, margins and menu engineering quadrants and decide where to act.' },
];

const freeFeatures = ['1 location', 'Up to 30 recipes', 'Up to 50 ingredients', 'Invoice upload', 'Basic AI advisor'];
const proFeatures = ['Everything in Free', 'Unlimited locations', 'Unlimited recipes and ingredients', 'Advanced AI advisor', 'Professional menu engineering', 'Advanced food cost analytics', 'Priority support'];

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
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Nav */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Brain className="text-orange-500" size={22} />
            <span>RistoBrain</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="px-2 py-2 text-white/60 hover:text-white transition-colors" aria-label="Italiano">IT</Link>
            <a href="#pricing" className="hidden sm:block px-3 py-2 text-white/80 hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="px-3 py-2 text-white/80 hover:text-white transition-colors">Sign in</Link>
            <Link href="/login?tab=register" className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-medium transition-colors">
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
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold transition-colors">
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

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need to control costs</h2>
        <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">
          From recipes to margins: RistoBrain brings together the tools a restaurateur uses every day.
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
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">{s.n}</div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Simple, transparent pricing</h2>
        <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">
          Start for free, upgrade to Pro whenever you want. No lock-in, cancel anytime.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-lg">Free</h3>
            <div className="flex items-baseline gap-1 mt-1 mb-5">
              <span className="text-4xl font-extrabold">0€</span>
              <span className="text-white/50 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check size={15} className="text-white/40 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/login?tab=register" className="block text-center py-2.5 rounded-lg border border-white/15 hover:border-white/30 text-white/90 font-semibold text-sm transition-colors">
              Start for free
            </Link>
          </div>
          <div className="rounded-2xl border border-orange-500/40 bg-orange-500/[0.06] p-6 relative">
            <span className="absolute -top-3 left-6 text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-semibold">Recommended</span>
            <h3 className="font-bold text-lg">Pro</h3>
            <div className="flex items-baseline gap-1 mt-1 mb-5">
              <span className="text-4xl font-extrabold">49€</span>
              <span className="text-white/50 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                  <Check size={15} className="text-orange-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/login?tab=register" className="block text-center py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-colors">
              Go Pro
            </Link>
          </div>
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
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold transition-colors">
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
            &copy; {new Date().getFullYear()} RistoBrain. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
