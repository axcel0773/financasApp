'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { navegarComGarantia } from '../navegacao';

/** No mobile abre a página do item; no desktop (≥1024px) seleciona a linha e mostra o detalhe ao lado. */
export function LinkLinha({
  href,
  hrefDesktop,
  className,
  children,
  selecionada,
}: {
  href: string;
  hrefDesktop?: string;
  className?: string;
  children: React.ReactNode;
  selecionada?: boolean;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      aria-current={selecionada ? 'true' : undefined}
      className={className}
      onClick={(e) => {
        if (!hrefDesktop || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (window.innerWidth < 1024) return;
        e.preventDefault();
        navegarComGarantia(router, hrefDesktop, { scroll: false });
      }}
    >
      {children}
    </Link>
  );
}
