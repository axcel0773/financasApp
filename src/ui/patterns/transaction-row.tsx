import Link from 'next/link';
import { cx } from '../cx';
import { Chip } from '../primitives/chip';
import { Icon } from '../primitives/icon';
import { AmountDisplay } from './amount-display';

export interface LinhaTransacao {
  id: string;
  href?: string;
  descricao: string;
  categoria: { nome: string; cor: string } | null;
  carteira: string;
  data: string;
  cents: number;
  kind: 'expense' | 'income';
  origem?: string;
  /** Nome da viagem, quando o gasto pertence a uma. */
  viagem?: string;
  pendente?: boolean;
}

/** Linha de lista no mobile; vira linha de tabela (data, descrição, categoria, carteira, valor) a partir de 1024px. */
/** `compacto`: mantém o layout de lista mesmo no desktop (para colunas estreitas, como no Início). */
export function TransactionRow({ t, compacto = false }: { t: LinhaTransacao; compacto?: boolean }) {
  const tabela = !compacto;
  const conteudo = (
    <div
      className={cx(
        'flex min-h-14 items-center gap-3 py-2',
        tabela && 'lg:grid lg:grid-cols-[88px_1fr_160px_120px_140px] lg:gap-4',
        t.pendente && 'opacity-70',
      )}
    >
      {tabela && <span className="hidden text-sm text-muted lg:block">{t.data}</span>}
      <span
        aria-hidden
        className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white',
          tabela && 'lg:hidden',
        )}
        style={{ background: t.categoria?.cor ?? '#667085' }}
      >
        {(t.categoria?.nome ?? t.descricao).slice(0, 1).toUpperCase()}
      </span>
      <span className={cx('min-w-0 flex-1', tabela && 'lg:flex-none')}>
        <span className="block truncate font-semibold">{t.descricao}</span>
        <span className={cx('block truncate text-xs text-muted', tabela && 'lg:hidden')}>
          {t.categoria?.nome ?? 'Sem categoria'} · {t.carteira} · {t.data}
        </span>
        <span className="mt-0.5 flex gap-1.5">
          {t.pendente && (
            <Chip tom="alert">
              <Icon name="offline" size={12} />
              Pendente de envio
            </Chip>
          )}
          {t.viagem && <Chip tom="info">Viagem · {t.viagem}</Chip>}
          {t.origem && <Chip>{t.origem}</Chip>}
        </span>
      </span>
      {tabela && (
        <>
          <span className="hidden truncate text-sm lg:block">
            {t.categoria?.nome ?? 'Sem categoria'}
          </span>
          <span className="hidden truncate text-sm text-muted lg:block">{t.carteira}</span>
        </>
      )}
      <span className="text-right">
        <AmountDisplay
          cents={t.kind === 'expense' ? -t.cents : t.cents}
          sinal
          tom={t.kind === 'expense' ? 'expense' : 'income'}
          size="sm"
        />
      </span>
    </div>
  );
  return t.href ? (
    <Link href={t.href} className="block border-b border-border last:border-0 hover:bg-soft">
      {conteudo}
    </Link>
  ) : (
    <div className="border-b border-border last:border-0">{conteudo}</div>
  );
}

export function TransactionHeader() {
  return (
    <div className="hidden border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-muted lg:grid lg:grid-cols-[88px_1fr_160px_120px_140px] lg:gap-4">
      <span>Data</span>
      <span>Descrição</span>
      <span>Categoria</span>
      <span>Carteira</span>
      <span className="text-right">Valor</span>
    </div>
  );
}
