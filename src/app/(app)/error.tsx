'use client';

import Link from 'next/link';
import { Button, ButtonLink } from '@/ui/primitives/button';

/** Erro dentro das telas do app: mantém o menu e dá saída (tentar de novo ou voltar ao Início). Sem detalhes técnicos. */
export default function ErroDoApp({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Não foi possível carregar</h1>
      <p className="text-muted">
        Pode ser a conexão ou uma falha momentânea. Seus dados não foram alterados.
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={reset} block>
          Tentar de novo
        </Button>
        <ButtonLink href="/" variant="secondary" block>
          Voltar ao Início
        </ButtonLink>
      </div>
      <p className="text-xs text-muted">
        Sem internet? Novos lançamentos ficam na fila e são enviados quando a conexão voltar. Veja{' '}
        <Link href="/gastos/novo" className="text-link underline">
          Novo lançamento
        </Link>
        .
      </p>
    </div>
  );
}
