import Link from 'next/link';
import { Icon } from '../primitives/icon';

/** Troca de mês: setas redondas e o mês no centro. */
export function MonthSwitch({ anterior, proximo, rotulo }: { anterior: string; proximo: string; rotulo: string }) {
  const seta = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-ink hover:bg-border';
  return (
    <div className="mb-4 flex items-center gap-2">
      <Link href={anterior} aria-label="Mês anterior" className={seta}>
        <Icon name="back" size={20} />
      </Link>
      <p className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-soft px-4 text-sm font-semibold first-letter:uppercase">
        {rotulo}
      </p>
      <Link href={proximo} aria-label="Próximo mês" className={seta}>
        <Icon name="chevron" size={20} />
      </Link>
    </div>
  );
}
