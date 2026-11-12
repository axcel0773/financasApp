'use client';

import { useEffect, useState } from 'react';
import { dataCurta } from '@/ui/format';
import { listarFila, type ItemFila } from '@/infra/offline/queue';
import { TransactionRow } from '@/ui/patterns/transaction-row';

/** Itens salvos offline que ainda não foram enviados ("pendente de envio"). */
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
      className="mb-4 rounded-lg border border-border bg-surface px-4"
    >
      {fila.map((i) => (
        <TransactionRow
          key={i.clientId}
          t={{
            id: i.clientId,
            descricao: i.note ?? 'Lançamento',
            categoria: i.categoryId ? (categorias[i.categoryId] ?? null) : null,
            carteira: carteiras[i.walletId] ?? '',
            data: dataCurta(i.occurredOn),
            cents: i.amountCents,
            kind: i.kind,
            pendente: true,
          }}
        />
      ))}
    </section>
  );
}
