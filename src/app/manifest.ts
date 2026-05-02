import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VPS Monitor',
    short_name: 'VPS Monitor',
    description: 'Internal VPS monitoring dashboard',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
