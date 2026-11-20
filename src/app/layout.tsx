import type { Metadata, Viewport } from 'next';
import { ehDestaque } from '@/ui/theme/destaques';
import { Onest } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import './globals.css';

const body = Onest({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Controle pessoal de gastos, renda e investimentos',
  robots: { index: false, follow: false },
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    title: 'Finanças',
    statusBarStyle: 'black-translucent',
    startupImage: [
    { url: '/splash/1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
    { url: '/splash/1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
    { url: '/splash/1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
    { url: '/splash/1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
    { url: '/splash/1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
    { url: '/splash/750x1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    { url: '/splash/828x1792.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    { url: '/splash/1242x2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
    { url: '/splash/1536x2048.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    { url: '/splash/1668x2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    { url: '/splash/2048x2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    ],
  },
};
export const viewport: Viewport = { themeColor: '#0a0a0b', viewportFit: 'cover' };

/** Lê os headers para que toda página seja renderizada por requisição: só assim o Next aplica o nonce da CSP aos scripts. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();
  // Escuro é o padrão. O cookie espelha a escolha salva em Ajustes para o servidor já entregar o tema certo.
  const salvo = (await cookies()).get('tema')?.value;
  const tema = salvo === 'light' || salvo === 'system' ? salvo : 'dark';
  const cor = (await cookies()).get('destaque')?.value;
  const destaque = ehDestaque(cor) ? cor : 'lima';
  return (
    <html lang="pt-BR" className={body.variable} data-theme={tema} data-accent={destaque}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
