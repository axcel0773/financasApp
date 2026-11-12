'use client';

import { useEffect, useState } from 'react';
import { dataCurta } from '@/ui/format';
import { listarFila, removerDaFila, type ItemFila } from '@/infra/offline/queue';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Button } from '@/ui/primitives/button';

const ROTULO_OP = { criar: 'Novo', editar: 'Edição', excluir: 'Exclusão' } as const;

/** Itens salvos offline que ainda não foram enviados. Os que falharam mostram o motivo e podem ser descartados. */
export function PendingQueue({
  carteiras,
  categorias,
}: {
  carteiras: Record<string, string>;
  categorias: Record<string, { nome: string; cor: string }>;
}) {
  const [fila, setFila] = useState<ItemFila[]>([]);
  useEffect(() => {
    const ler = () =>
      listarFila()
        .then(setFila)
        .catch(() => setFila([]));
    ler();
    window.addEventListener('fila-alterada', ler);
    return () => window.removeEventListener('fila-alterada', ler);
  }, []);
  if (fila.length === 0) return null;
  return (
    <section
      aria-label="Pendentes de envio"
      className="mb-4 rounded-lg border border-border bg-surface px-4 pb-3"
    >
      <div className="flex min-h-12 items-center justify-between">
        <p className="font-semibold">Pendentes de envio ({fila.length})</p>
        <Button
          variant="secondary"
          onClick={() => window.dispatchEvent(new Event('online'))}
          aria-label="Tentar enviar agora"
        >
          Tentar agora
        </Button>
      </div>
      {fila.map((i) => (
        <div key={i.clientId} className="border-t border-border">
          {i.op === 'excluir' ? (
            <p className="min-h-14 py-3 text-sm">
              <span className="font-semibold">{ROTULO_OP[i.op]}</span> de um lançamento
            </p>
          ) : (
            <TransactionRow
              t={{
                id: i.clientId,
                descricao: `${ROTULO_OP[i.op]}: ${i.note ?? 'Lançamento'}`,
                categoria: i.categoryId ? (categorias[i.categoryId] ?? null) : null,
                carteira: carteiras[i.walletId] ?? '',
                data: dataCurta(i.occurredOn),
                cents: i.amountCents,
                kind: i.op === 'criar' ? i.kind : 'expense',
                pendente: true,
              }}
            />
          )}
          {i.tentativas > 0 && (
            <p role="status" className="pb-2 text-xs text-expense-text">
              Falhou {i.tentativas}x: {i.ultimoErro ?? 'sem resposta'}
            </p>
          )}
          {i.tentativas > 0 && (
            <Button variant="ghost" onClick={() => void removerDaFila(i.clientId)}>
              Descartar
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}
