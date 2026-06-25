import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import CookieBanner from '@/components/CookieBanner';

const SITE_URL = 'https://app.ristobrain.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RistoBrain — Software Food Cost e Menu Engineering per ristoranti',
    template: '%s | RistoBrain',
  },
  description:
    "RistoBrain e il software italiano per calcolare il food cost, fare menu engineering, gestire allergeni HACCP, scorte e avvisi prezzi. Aumenta i margini del tuo ristorante.",
  applicationName: 'RistoBrain',
  authors: [{ name: 'RistoBrain' }],
  creator: 'RistoBrain',
  publisher: 'RistoBrain',
  keywords: [
    'food cost',
    'software food cost',
    'calcolo food cost ristorante',
    'menu engineering',
    'ingegnerizzazione del menu',
    'marginalita menu',
    'gestionale ristorante',
    'software ristorazione',
    'allergeni',
    'HACCP',
    'food cost in cloud',
    'gestione ristorante',
  ],
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: SITE_URL,
    siteName: 'RistoBrain',
    title: 'RistoBrain — Software Food Cost e Menu Engineering',
    description:
      "Calcola il food cost, ottimizza il menu con il menu engineering e gestisci allergeni, scorte e prezzi. Una sola piattaforma per ristoratori.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RistoBrain — Software Food Cost e Menu Engineering',
    description:
      'Il software per ristoratori che vogliono aumentare i margini: food cost, menu engineering, allergeni e scorte.',
  },
  appleWebApp: {
    capable: true,
    title: 'RistoBrain',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="antialiased">
        {children}
        <CookieBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#242424',
              color: '#f5f5f5',
              border: '1px solid #3a3a3a',
            },
            success: { iconTheme: { primary: '#f97316', secondary: '#0f0f0f' } },
          }}
        />
      </body>
    </html>
  );
}
