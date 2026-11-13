'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/ui/primitives/icon';

/** Desktop (≥1024px): "Novo lançamento" abre em painel lateral sobre a lista. Esc fecha. */
export function PainelNovo({ fecharHref, children }: { fecharHref: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(fecharHref, { scroll: false });
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [router, fecharHref]);
  return (
    <div className="fixed inset-0 z-30 hidden lg:block">
      <Link href={fecharHref} scroll={false} aria-label="Fechar painel" tabIndex={-1} className="absolute inset-0 bg-ink/40" />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Novo lançamento"
        className="absolute inset-y-0 right-0 flex w-[460px] flex-col gap-4 overflow-y-auto bg-surface p-7 shadow-xl outline-none"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Novo lançamento</h2>
          <Link
            href={fecharHref}
            scroll={false}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-border"
          >
            <Icon name="close" size={18} />
          </Link>
        </div>
        {children}
        <p className="text-center text-xs text-muted">Esc fecha</p>
      </aside>
    </div>
  );
}
