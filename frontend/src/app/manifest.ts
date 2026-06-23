import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RistoBrain — Food Cost & Menu Engineering',
    short_name: 'RistoBrain',
    description: 'Food Cost & Menu Engineering per ristoratori',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f0f0f',
    theme_color: '#0f0f0f',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
