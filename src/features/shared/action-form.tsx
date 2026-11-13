'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { parseBRL } from '@/core/shared/money';
import { enfileirar } from '@/infra/offline/queue';
import { ESTADO_INICIAL, type ActionState } from '@/app/_lib/action-state';
import { Button } from '@/ui/primitives/button';
import { useToast } from '@/ui/primitives/toast';

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
  const formRef = useRef<HTMLFormElement>(null);
  const emVoo = useRef(false);
  const [state, setState] = useState<ActionState>(ESTADO_INICIAL);
  const [pending, setPending] = useState(false);
  const { show } = useToast();
  useEffect(() => {
    if (state.ok && state.message) {
      show(state.message);
      onOk?.();
    }
  }, [state, show, onOk]);

  // Envio feito à mão, sem useActionState/useTransition: nesta combinação (Next 15 + React 19) a transição
  // às vezes nunca termina — a resposta chega, o dado é salvo e a tela fica em "Salvando…". Aqui o estado
  // de envio é nosso e sempre volta ao normal.
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
        router.push('/gastos');
      });
      return;
    }
    if (emVoo.current) return;
    emVoo.current = true;
    setPending(true);
    try {
      const r = await action(state, fd);
      setState(r);
      if (r.ok) formRef.current?.reset();
    } catch {
      setState({ ok: false, message: 'Não foi possível concluir. Tente novamente.' });
    } finally {
      emVoo.current = false;
      setPending(false);
    }
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
