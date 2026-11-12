'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '../cx';
import { Icon } from '../primitives/icon';
import type { ItemNav } from './nav-items';

/** `bottom`: pílula flutuante (item ativo mostra o rótulo). `side`: trilho/sidebar do desktop. */
export function NavLink({ item, variante }: { item: ItemNav; variante: 'bottom' | 'side' }) {
  const path = usePathname();
  const ativo =
    item.href === '/' ? path === '/' : path === item.href || path.startsWith(`${item.href}/`);
  if (variante === 'bottom') {
    return (
      <Link
        href={item.href}
        aria-current={ativo ? 'page' : undefined}
        className={cx(
          'flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold',
          ativo ? 'flex-[1.5] bg-primary text-primary-fg' : 'flex-1 text-muted',
        )}
      >
        <Icon name={item.icon} size={ativo ? 20 : 22} />
        <span className={ativo ? undefined : 'sr-only'}>{item.label}</span>
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={ativo ? 'page' : undefined}
      className={cx(
        'flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-semibold md:flex-col md:justify-center md:gap-0.5 md:px-1 md:text-[10px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-sm',
        ativo ? 'bg-soft text-ink' : 'text-muted hover:text-ink',
      )}
    >
      <Icon name={item.icon} size={22} />
      <span>{item.label}</span>
    </Link>
  );
}
