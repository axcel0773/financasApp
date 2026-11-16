import Link from 'next/link';
import { Icon } from '../primitives/icon';

/** Cartão-widget do Início: uma mini-visualização, um número e o caminho para o detalhe. */
export function Widget({
  href,
  rotulo,
  valor,
  contexto,
  visual,
}: {
  /** Sem destino, o cartão é só informativo. */
  href?: string;
  rotulo: string;
  valor: React.ReactNode;
  contexto?: React.ReactNode;
  visual: React.ReactNode;
}) {
  const classe =
    'flex min-h-[152px] flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-colors';
  const conteudo = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="flex h-11 min-w-0 flex-1 items-center">{visual}</span>
        {href && <Icon name="chevron" size={18} className="shrink-0 text-muted" />}
      </span>
      <span className="mt-4 block min-w-0">
        <span className="block truncate text-xs text-muted">{rotulo}</span>
        <span className="block truncate">{valor}</span>
        {contexto && <span className="block truncate text-xs text-muted">{contexto}</span>}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={`${classe} hover:border-muted`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
