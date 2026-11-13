import Link from 'next/link';
import { Icon } from '../primitives/icon';
import { NavLink } from './nav-link';
import { NAV_INVESTIR, NAV_PLANEJAMENTO, NAV_PRINCIPAL } from './nav-items';

/** ≥ 768px: trilho lateral (ícone + rótulo). ≥ 1024px: sidebar fixa de 240px com todas as seções. */
export function Sidebar({ sairIcone, sairBloco }: { sairIcone?: React.ReactNode; sairBloco?: React.ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col overflow-y-auto border-r border-border bg-surface p-2 md:flex lg:w-60 lg:p-4">
      <p className="mb-4 hidden font-display text-xl font-semibold text-ink lg:block">
        Finanças
      </p>
      <Link
        href="/gastos/novo"
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg lg:hidden"
        aria-label="Novo lançamento"
      >
        <Icon name="plus" />
      </Link>
      <nav aria-label="Navegação principal" className="flex flex-col gap-1">
        {NAV_PRINCIPAL.map((i) => (
          <NavLink key={i.href} item={i} variante="side" />
        ))}
      </nav>
      <div className="mt-4 hidden flex-col gap-1 lg:flex">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Planejamento
        </p>
        {NAV_PLANEJAMENTO.map((i) => (
          <NavLink key={i.href} item={i} variante="side" />
        ))}
        <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Investir
        </p>
        {NAV_INVESTIR.map((i) => (
          <NavLink key={i.href} item={i} variante="side" />
        ))}
      </div>
      {(sairIcone || sairBloco) && (
        <div className="mt-auto pt-4">
          <div className="lg:hidden">{sairIcone}</div>
          <div className="hidden lg:block">{sairBloco}</div>
        </div>
      )}
    </aside>
  );
}
