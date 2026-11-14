'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { navegarComGarantia } from '@/ui/navegacao';
import { Icon } from '@/ui/primitives/icon';
import { HideToggle } from './hide-toggle';

/** Só no desktop (≥1024px): busca, ocultar valores e novo lançamento sempre à mão. Atalhos: "/" busca, "N" novo. */
export function Topbar() {
  const router = useRouter();
  const busca = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (window.innerWidth < 1024) return;
      if (e.key === '/') {
        e.preventDefault();
        busca.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navegarComGarantia(router, '/gastos?novo=1');
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [router]);
  return (
    <header className="sticky top-0 z-10 hidden items-center justify-end gap-3 border-b border-border bg-surface/95 px-8 py-3 backdrop-blur lg:flex">
      <form
        role="search"
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          const q = busca.current?.value.trim();
          navegarComGarantia(router, q ? `/gastos?tudo=1&q=${encodeURIComponent(q)}` : '/gastos');
        }}
      >
        <input
          ref={busca}
          type="search"
          maxLength={80}
          aria-label="Buscar lançamentos em todo o histórico"
          placeholder="Buscar lançamentos  ( / )"
          className="h-11 w-72 rounded-md border border-border bg-surface pl-3 pr-3 text-sm text-ink placeholder:text-muted"
        />
      </form>
      <HideToggle />
      <Link
        href="/gastos?novo=1"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg"
      >
        <Icon name="plus" size={18} />
        Novo lançamento
        <kbd className="rounded bg-white/20 px-1.5 text-xs font-medium">N</kbd>
      </Link>
    </header>
  );
}
