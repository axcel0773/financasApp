'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '../cx';
import { Icon } from '../primitives/icon';
import type { ItemNav } from './nav-items';

export function NavLink({ item, variante }: { item: ItemNav; variante: 'bottom' | 'side' }) {
  const path = usePathname();
  const ativo =
    item.href === '/' ? path === '/' : path === item.href || path.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      aria-current={ativo ? 'page' : undefined}
      className={cx(
        variante === 'bottom'
          ? 'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold'
          : 'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold md:flex-col md:justify-center md:gap-0.5 md:px-1 md:text-[10px] lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm',
        ativo ? 'text-primary' : 'text-muted hover:text-ink',
        variante === 'side' && ativo && 'bg-bg',
      )}
    >
      <Icon name={item.icon} size={22} />
      <span>{item.label}</span>
    </Link>
  );
}
