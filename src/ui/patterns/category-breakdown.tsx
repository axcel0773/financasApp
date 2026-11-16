import Link from 'next/link';
import { formatBRL } from '@/core/shared/money';
import { cx } from '../cx';
import { CategoryIcon, tomDaCategoria } from './category-icon';

export interface ItemCategoria {
  id: string | null;
  nome: string;
  cor: string | null;
  cents: number;
  pct: number;
  /** Quando presente, a linha vira link (ex.: filtrar a lista por esta categoria). */
  href?: string;
  ativo?: boolean;
}

/** Para onde foi o dinheiro: barra segmentada + lista com ícone, percentual e valor. */
export function CategoryBreakdown({ itens, titulo }: { itens: ItemCategoria[]; titulo: string }) {
  const total = itens.reduce((s, i) => s + i.cents, 0);
  return (
    <div>
      <div
        role="img"
        aria-label={`${titulo}: ${itens.map((i) => `${i.nome} ${Math.round(i.pct)}%`).join(', ')}`}
        className="flex h-3 gap-1"
      >
        {itens.map((i) => (
          <span
            key={i.id ?? 'sem'}
            className="h-full rounded-full"
            style={{ flexGrow: Math.max(i.cents, total * 0.02), flexBasis: 0, background: tomDaCategoria(i.cor) }}
          />
        ))}
      </div>
      <ul className="mt-3">
        {itens.map((i) => {
          const linha = (
            <span className="flex min-h-14 items-center gap-3 py-1.5">
              <CategoryIcon nome={i.nome} cor={i.cor} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{i.nome}</span>
                <span className="block text-xs text-muted">{Math.round(i.pct)}%</span>
              </span>
              <span className="amount shrink-0 whitespace-nowrap font-semibold">{formatBRL(i.cents)}</span>
            </span>
          );
          return (
            <li key={i.id ?? 'sem'} className="border-b border-border last:border-0">
              {i.href ? (
                <Link
                  href={i.href}
                  aria-current={i.ativo ? 'true' : undefined}
                  className={cx('-mx-2 block rounded-md px-2 hover:bg-soft', i.ativo && 'bg-soft')}
                >
                  {linha}
                </Link>
              ) : (
                linha
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
