'use client';

import { useActionState, useEffect } from 'react';
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
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  variante?: 'primary' | 'secondary' | 'danger';
  onOk?: () => void;
}) {
  const [state, run, pending] = useActionState(action, ESTADO_INICIAL);
  const { show } = useToast();
  useEffect(() => {
    if (state.ok && state.message) {
      show(state.message);
      onOk?.();
    }
  }, [state, show, onOk]);
  return (
    <form action={run} className={className ?? 'space-y-3'}>
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
