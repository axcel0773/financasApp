import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finanças',
    short_name: 'Finanças',
    description: 'Controle pessoal de gastos, renda e investimentos',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f6f5',
    theme_color: '#0b3b2e',
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Novo gasto',
        short_name: 'Novo gasto',
        url: '/gastos/novo',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
