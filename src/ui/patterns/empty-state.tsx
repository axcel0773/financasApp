import type { IconName } from '../primitives/icon';
import { ButtonLink } from '../primitives/button';
import { IconeRedondo } from './round-icon';

/**
 * Tela ou bloco sem conteúdo: diz o que falta e, quando dá, leva direto para resolver.
 * `acao` é um link (o app não abre formulários por âncora); sem ela, o texto aponta o caminho.
 */
export function EmptyState({
  title,
  children,
  icone,
  acao,
}: {
  title: string;
  children?: React.ReactNode;
  icone?: IconName;
  acao?: { href: string; rotulo: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-border px-5 py-7 text-center">
      {icone && <IconeRedondo nome={icone} className="mb-3" />}
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
      {acao && (
        <ButtonLink href={acao.href} variant="secondary" className="mt-4">
          {acao.rotulo}
        </ButtonLink>
      )}
    </div>
  );
}
