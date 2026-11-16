import { formatBRL } from '@/core/shared/money';
import { cx } from '../cx';

type Tom = 'default' | 'income' | 'expense' | 'onDark';
const TOM: Record<Tom, string> = {
  default: 'text-ink',
  income: 'text-income',
  expense: 'text-expense-text',
  onDark: 'text-white',
};
const TAM = {
  sm: 'text-sm font-semibold',
  md: 'text-lg font-semibold',
  lg: 'text-2xl font-semibold',
  // encolhe em telas estreitas: valores de seis dígitos cabem em 360 px sem estourar o cartão
  xl: 'text-[clamp(2rem,9.5vw,2.75rem)] font-semibold leading-[1.1] tracking-tight',
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
    <span className={cx('amount whitespace-nowrap', TOM[tom], TAM[size], className)}>
      {prefixo}
      {formatBRL(sinal ? Math.abs(cents) : cents)}
    </span>
  );
}
