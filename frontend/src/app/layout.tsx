import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'RistoBrain | MenuMaster',
  description: 'Food Cost & Menu Engineering per ristoratori professionisti',
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
