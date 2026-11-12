'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { parseBRL } from '@/core/shared/money';
import { enfileirar } from '@/infra/offline/queue';
import { ESTADO_INICIAL, type ActionState } from '@/app/_lib/action-state';
import { Button } from '../primitives/button';
import { useToast } from '../primitives/toast';

/** Formulário com Server Action: mostra erro no lugar e confirma o sucesso num toast. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className,
  variante = 'primary',
  onOk,
  offlineEditar,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  variante?: 'primary' | 'secondary' | 'danger';
  onOk?: () => void;
  /** Se estiver sem rede ao enviar, guarda a edição deste lançamento na fila offline. */
  offlineEditar?: { alvoId: string };
}) {
  const router = useRouter();
  const [state, run, pending] = useActionState(action, ESTADO_INICIAL);
  const { show } = useToast();
  useEffect(() => {
    if (state.ok && state.message) {
      show(state.message);
      onOk?.();
    }
  }, [state, show, onOk]);
  return (
    <form
      action={run}
      className={className ?? 'space-y-3'}
      onSubmit={(e) => {
        if (!offlineEditar || navigator.onLine) return;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const valor = parseBRL(String(fd.get('amount') ?? ''));
        if (!valor.ok || valor.value <= 0) return show('Informe um valor válido.');
        void enfileirar({
          clientId: `editar:${offlineEditar.alvoId}`,
          op: 'editar',
          alvoId: offlineEditar.alvoId,
          walletId: String(fd.get('walletId') ?? ''),
          categoryId: String(fd.get('categoryId') ?? '') || null,
          amountCents: valor.value,
          occurredOn: String(fd.get('occurredOn') ?? ''),
          note: String(fd.get('note') ?? '').trim() || null,
        }).then(() => {
          show('Sem conexão: a edição será enviada quando voltar.');
          router.push('/gastos');
        });
      }}
    >
      {children}
      {!state.ok && state.message && (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-expense-text">
          {state.message}
        </p>
      )}
      <Button type="submit" variant={variante} disabled={pending} block>
        {pending ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  );
}
