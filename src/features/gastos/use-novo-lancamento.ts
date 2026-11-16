'use client';

import { useState } from 'react';
import { criarLancamentoAction } from '@/app/_actions/gastos';
import { enfileirar } from '@/infra/offline/queue';
import { useToast } from '@/ui/primitives/toast';
import { useEnvio } from '@/features/shared/use-envio';

/**
 * Estado e envio do novo lançamento, comum à página do celular e à janela do desktop.
 * Funciona offline: sem conexão (ou se a rede cair no meio), o item vai para a fila local e é reenviado depois.
 */
export function useNovoLancamento({
  hoje,
  carteiraInicial,
  viagemInicial = null,
}: {
  hoje: string;
  carteiraInicial: string;
  viagemInicial?: string | null;
}) {
  const { show } = useToast();
  const { pending, enviar, navegar, atualizarTela } = useEnvio();
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const [cents, setCents] = useState(0);
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [walletId, setWalletId] = useState(carteiraInicial);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [data, setData] = useState(hoje);
  const [note, setNote] = useState('');
  const [tripId, setTripId] = useState<string | null>(viagemInicial);
  const [erro, setErro] = useState<string | null>(null);

  /** `continuar`: depois de salvar, limpa valor, categoria e descrição e fica na janela para o próximo. */
  const salvar = async ({ continuar = false }: { continuar?: boolean } = {}) => {
    setErro(null);
    if (cents <= 0) return setErro('Informe um valor maior que zero.');
    const item = {
      op: 'criar' as const,
      clientId,
      walletId,
      categoryId,
      kind,
      amountCents: cents,
      occurredOn: data,
      note: note.trim() || null,
      tripId: kind === 'expense' ? tripId : null,
    };
    const concluir = (msg: string) => {
      show(msg);
      if (!continuar) return navegar('/gastos');
      setClientId(crypto.randomUUID());
      setCents(0);
      setCategoryId(null);
      setNote('');
      atualizarTela();
    };
    await enviar(async () => {
      if (!navigator.onLine) {
        await enfileirar(item);
        return concluir('Sem conexão: salvo no aparelho e será enviado quando voltar.');
      }
      try {
        const r = await criarLancamentoAction(item);
        if (!r.ok) return setErro(r.message);
        concluir('Lançamento salvo.');
      } catch {
        await enfileirar(item); // queda de rede no meio do envio: o reenvio é idempotente
        concluir('Conexão instável: salvo no aparelho e será reenviado.');
      }
    });
  };

  return {
    cents, setCents, kind, setKind, walletId, setWalletId, categoryId, setCategoryId,
    data, setData, note, setNote, tripId, setTripId, erro, pending, salvar,
  };
}
