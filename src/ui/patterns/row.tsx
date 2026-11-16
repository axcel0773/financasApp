import Link from 'next/link';
import { cx } from '../cx';

/**
 * Linha de lista: ícone à esquerda, título e contexto no meio, valor ou ação à direita.
 * Com `href`, a linha inteira vira link.
 */
export function Linha({
  icone,
  titulo,
  contexto,
  direita,
  href,
  className,
}: {
  icone?: React.ReactNode;
  titulo: React.ReactNode;
  contexto?: React.ReactNode;
  direita?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const corpo = (
    <span className="flex min-h-14 items-center gap-3 py-2">
      {icone}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{titulo}</span>
        {contexto && <span className="block truncate text-xs text-muted">{contexto}</span>}
      </span>
      {direita && <span className="shrink-0 text-right">{direita}</span>}
    </span>
  );
  const classe = cx('block border-b border-border last:border-0', className);
  return href ? (
    <Link href={href} className={cx(classe, '-mx-2 rounded-md px-2 hover:bg-soft')}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}

/** Lista de `Linha` dentro de um cartão. */
export function ListaCartao({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('rounded-xl border border-border bg-surface px-4 py-1', className)}>{children}</div>;
}
