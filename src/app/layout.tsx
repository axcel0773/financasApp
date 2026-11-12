import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const display = Manrope({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Controle pessoal de gastos, renda e investimentos',
  robots: { index: false, follow: false },
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Finanças', statusBarStyle: 'black-translucent' },
};
export const viewport: Viewport = { themeColor: '#0b3b2e', viewportFit: 'cover' };

/** Lê os headers para que toda página seja renderizada por requisição: só assim o Next aplica o nonce da CSP aos scripts. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
