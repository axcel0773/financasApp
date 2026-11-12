import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '../cx';

type Tom = 'neutral' | 'ok' | 'alert' | 'danger' | 'info';
const TOM: Record<Tom, string> = {
  neutral: 'bg-soft text-muted',
  ok: 'bg-ok-bg text-income',
  alert: 'bg-danger-bg text-expense-text',
  danger: 'bg-danger-bg text-expense-text',
  info: 'bg-soft text-voucher',
};
/** Estado nunca depende só de cor: sempre há texto (e ícone, quando passado). */
export function Chip({
  tom = 'neutral',
  children,
  className,
}: {
  tom?: Tom;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex min-h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold',
        TOM[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}
export function FilterChip({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? 'true' : undefined}
      className={cx(
        'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold',
        ativo ? 'border-primary bg-primary text-primary-fg' : 'border-transparent bg-soft text-ink',
      )}
    >
      {children}
    </Link>
  );
}
