import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { cx } from '../cx';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none';
const VAR: Record<Variante, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'border border-border bg-surface text-ink hover:bg-bg',
  ghost: 'text-primary hover:bg-bg',
  danger: 'border border-border bg-surface text-expense-text hover:bg-bg',
};
export function Button({
  variant = 'primary',
  block,
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variante; block?: boolean }) {
  return <button {...p} className={cx(BASE, VAR[variant], block && 'w-full', className)} />;
}
export function ButtonLink({
  variant = 'primary',
  block,
  className,
  ...p
}: ComponentProps<typeof Link> & { variant?: Variante; block?: boolean }) {
  return <Link {...p} className={cx(BASE, VAR[variant], block && 'w-full', className)} />;
}
