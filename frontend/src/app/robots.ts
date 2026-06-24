import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/admin',
        '/impostazioni',
        '/ingredients',
        '/engineering',
        '/ai',
        '/allergeni',
        '/avvisi',
        '/scorte',
        '/locations',
        '/billing',
      ],
    },
    sitemap: 'https://app.ristobrain.com/sitemap.xml',
    host: 'https://app.ristobrain.com',
  };
}
