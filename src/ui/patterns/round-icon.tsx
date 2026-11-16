import { cx } from '../cx';
import { Icon, type IconName } from '../primitives/icon';

const TONS = {
  neutro: 'bg-soft text-ink',
  destaque: 'bg-accent text-accent-fg',
  entrada: 'bg-ok-bg text-income',
  saida: 'bg-danger-bg text-expense-text',
  viagem: 'bg-soft text-trip',
} as const;

/** Ícone num quadrado arredondado, para o que não é categoria (conta, cartão, salário, fixo, fatura). */
export function IconeRedondo({
  nome,
  tom = 'neutro',
  className,
}: {
  nome: IconName;
  tom?: keyof typeof TONS;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]', TONS[tom], className)}
    >
      <Icon name={nome} size={18} />
    </span>
  );
}
