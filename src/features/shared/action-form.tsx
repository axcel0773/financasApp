'use client';

import { useEffect, useRef, useState } from 'react';
import { parseBRL } from '@/core/shared/money';
import { enfileirar } from '@/infra/offline/queue';
import { ESTADO_INICIAL, type ActionState } from '@/app/_lib/action-state';
import { Button } from '@/ui/primitives/button';
import { useToast } from '@/ui/primitives/toast';
import { useEnvio } from './use-envio';

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
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>(ESTADO_INICIAL);
  const { pending, enviar: comTrava, atualizarTela, navegar } = useEnvio();
  const { show } = useToast();
  useEffect(() => {
    if (state.ok && state.message) {
      show(state.message);
      onOk?.();
    }
  }, [state, show, onOk]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (offlineEditar && !navigator.onLine) {
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
        navegar('/gastos');
      });
      return;
    }
    await comTrava(async () => {
      try {
        const r = await action(state, fd);
        setState(r);
        if (r.ok) {
          // avisa quem estiver em volta (ex.: painéis que se fecham sozinhos ao salvar)
          form.dispatchEvent(new CustomEvent('action-ok', { bubbles: true }));
          formRef.current?.reset();
          atualizarTela();
        }
      } catch {
        setState({ ok: false, message: 'Não foi possível concluir. Tente novamente.' });
      }
    });
  }
  return (
    <form
      ref={formRef}
      method="post"
      className={className ?? 'space-y-3'}
      onSubmit={enviar}
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
