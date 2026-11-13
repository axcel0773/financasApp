'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef } from 'react';
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
  const enviado = useRef<FormData | null>(null);
  const [state, run, pending] = useActionState((prev: ActionState, fd: FormData) => {
    enviado.current = fd;
    return action(prev, fd);
  }, ESTADO_INICIAL);
  const { show } = useToast();
  // O React 19 limpa o formulário depois de toda Server Action. No erro, devolve o que a pessoa digitou.
  useEffect(() => {
    if (state.ok || !state.message || !enviado.current) return;
    const fd = enviado.current;
    const t = setTimeout(() => restaurarCampos(formRef.current, fd), 0);
    return () => clearTimeout(t);
  }, [state]);
  useEffect(() => {
    if (state.ok && state.message) {
      show(state.message);
      onOk?.();
    }
  }, [state, show, onOk]);
  return (
    <form
      ref={formRef}
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

function restaurarCampos(form: HTMLFormElement | null, fd: FormData) {
  if (!form) return;
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) continue;
    if (!el.name || (el instanceof HTMLInputElement && (el.type === 'hidden' || el.type === 'password' || el.type === 'file')))
      continue;
    const valores = fd.getAll(el.name).filter((v): v is string => typeof v === 'string');
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) el.checked = valores.includes(el.value);
    else if (valores.length > 0 || el.value !== '') el.value = valores[0] ?? '';
  }
}
