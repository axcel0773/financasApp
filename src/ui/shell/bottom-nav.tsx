import Link from 'next/link';
import { Icon } from '../primitives/icon';
import { NavLink } from './nav-link';
import { NAV_PRINCIPAL } from './nav-items';

/** Mobile (< 768px): barra inferior com botão central "+". */
export function BottomNav() {
  const [a, b, c, , e] = NAV_PRINCIPAL;
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5 items-center">
        <NavLink item={a!} variante="bottom" />
        <NavLink item={b!} variante="bottom" />
        <Link
          href="/gastos/novo"
          aria-label="Novo lançamento"
          className="fab mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg"
        >
          <Icon name="plus" size={28} />
        </Link>
        <NavLink item={c!} variante="bottom" />
        <NavLink item={e!} variante="bottom" />
      </div>
    </nav>
  );
}
