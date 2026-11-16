'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { navegarComGarantia } from '@/ui/navegacao';

/** Desktop (≥1024px): "Novo lançamento" abre numa janela no centro, sobre a tela escurecida. Esc fecha. */
export function PainelNovo({ fecharHref, children }: { fecharHref: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  // Portal no <body>: dentro da página, um ancestral com transição/transform prenderia o painel à área do conteúdo.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (!montado) return;
    // foco no primeiro campo (o valor); sem campo, na própria janela
    (ref.current?.querySelector<HTMLElement>('input') ?? ref.current)?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navegarComGarantia(router, fecharHref, { scroll: false });
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [router, fecharHref, montado]);
  if (!montado) return null;
  return createPortal(
    <div className="fixed inset-0 z-30 hidden items-center justify-center p-6 lg:flex">
      {/* Preto translúcido nos dois temas: escurece a tela por trás (a cor do texto clarearia no tema escuro). */}
      <Link href={fecharHref} scroll={false} aria-label="Fechar" tabIndex={-1} className="absolute inset-0 bg-black/65" />
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-novo"
        className="relative w-full max-w-[940px] overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.55)] outline-none"
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}
