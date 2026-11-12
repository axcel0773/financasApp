import Link from 'next/link';
import { Icon } from './icon';
import type { HTMLAttributes } from 'react';
import { cx } from '../cx';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-lg border border-border bg-surface p-4', className)} />;
}
export function Hero({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-2xl bg-primary-dark p-6 text-white', className)} />;
}
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold">{children}</h2>
      {action}
    </div>
  );
}
export function PageHeader({
  title,
  subtitle,
  back,
  voltar,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: React.ReactNode;
  voltar?: { href: string; label?: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {back}
        {voltar && (
          <Link
            href={voltar.href}
            aria-label={`Voltar${voltar.label ? ` para ${voltar.label}` : ''}`}
            className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-link"
          >
            <Icon name="back" size={20} />
            {voltar.label ?? 'Voltar'}
          </Link>
        )}
        <h1 className="font-display text-[26px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
