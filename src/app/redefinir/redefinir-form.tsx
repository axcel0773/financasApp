'use client';

import { useActionState } from 'react';
import { salvarNovaSenha, type RedefinirState } from './actions';

const initial: RedefinirState = { error: null };

export function RedefinirForm() {
  const [state, action, pending] = useActionState(salvarNovaSenha, initial);
  const field =
    'min-h-12 w-full rounded-md border border-border bg-surface px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
  return (
    <form action={action} className="space-y-4" noValidate>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nova senha</span>
        <input name="senha" type="password" autoComplete="new-password" required minLength={8} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Repita a nova senha</span>
        <input name="confirma" type="password" autoComplete="new-password" required minLength={8} className={field} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-expense-text">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-md bg-primary font-semibold text-primary-fg disabled:opacity-60"
      >
        {pending ? 'Salvando…' : 'Salvar nova senha'}
      </button>
    </form>
  );
}
