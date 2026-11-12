import Link from 'next/link';
import { Icon } from '../primitives/icon';
import { NavLink } from './nav-link';
import { NAV_PRINCIPAL } from './nav-items';

/** Mobile (< 768px): pílula flutuante com o botão "+" ao centro. */
export function BottomNav() {
  const [a, b, c, , e] = NAV_PRINCIPAL;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] md:hidden">
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto mx-auto flex h-16 max-w-md items-center gap-0.5 rounded-full border border-border bg-surface px-2 shadow-[0_6px_24px_rgba(13,27,42,0.16)]"
      >
        <NavLink item={a!} variante="bottom" />
        <NavLink item={b!} variante="bottom" />
        <Link
          href="/gastos/novo"
          aria-label="Novo lançamento"
          className="fab mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brass bg-primary text-primary-fg"
        >
          <Icon name="plus" size={24} />
        </Link>
        <NavLink item={c!} variante="bottom" />
        <NavLink item={e!} variante="bottom" />
      </nav>
    </div>
  );
}
