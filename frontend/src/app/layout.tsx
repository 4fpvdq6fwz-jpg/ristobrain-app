import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'RistoBrain — Food Cost & Menu Engineering',
  description: 'Food Cost & Menu Engineering per ristoratori professionisti',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RistoBrain',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="antialiased">
        {children}
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
