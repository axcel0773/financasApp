import { formatBRL } from '@/core/shared/money';
import { cx } from '../cx';

type Tom = 'default' | 'income' | 'expense' | 'onDark';
const TOM: Record<Tom, string> = {
  default: 'text-ink',
  income: 'text-primary',
  expense: 'text-expense-text',
  onDark: 'text-white',
};
const TAM = {
  sm: 'text-sm font-semibold',
  md: 'text-lg font-bold',
  lg: 'text-2xl font-extrabold',
  xl: 'text-4xl font-extrabold',
} as const;

/** Valores em Manrope, tabulares; `.amount` permite ocultar tudo pelo botão do olho. */
export function AmountDisplay({
  cents,
  tom = 'default',
  size = 'md',
  sinal,
  className,
}: {
  cents: number;
  tom?: Tom;
  size?: keyof typeof TAM;
  sinal?: boolean;
  className?: string;
}) {
  const prefixo = sinal ? (cents < 0 ? '− ' : '+ ') : '';
  return (
    <span className={cx('amount', TOM[tom], TAM[size], className)}>
      {prefixo}
      {formatBRL(sinal ? Math.abs(cents) : cents)}
    </span>
  );
}
