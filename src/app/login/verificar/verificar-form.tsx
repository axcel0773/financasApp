'use client';

import { useActionState } from 'react';
import { verificarCodigo, logout, type LoginState } from '../actions';

const initial: LoginState = { error: null };

export function VerificarForm() {
  const [state, action, pending] = useActionState(verificarCodigo, initial);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Código de 6 dígitos</span>
          <input
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            className="min-h-12 w-full rounded-[14px] border border-border bg-surface px-4 text-center text-xl tracking-[0.4em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {state.error && (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-expense-text">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-full bg-primary font-semibold text-primary-fg disabled:opacity-60"
        >
          {pending ? 'Verificando…' : 'Confirmar'}
        </button>
      </form>
      <form action={logout}>
        <button type="submit" className="min-h-11 w-full text-sm font-medium text-muted">
          Sair e entrar com outra conta
        </button>
      </form>
    </div>
  );
}
