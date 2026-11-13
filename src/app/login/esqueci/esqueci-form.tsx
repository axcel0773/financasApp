'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { pedirRedefinicao, type EsqueciState } from './actions';

const initial: EsqueciState = { error: null, enviado: false };

export function EsqueciForm() {
  const [state, action, pending] = useActionState(pedirRedefinicao, initial);
  const field =
    'min-h-12 w-full rounded-md border border-border bg-surface px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  if (state.enviado)
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-md bg-soft px-3 py-3 text-sm">
          Se o e-mail tiver conta, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.
        </p>
        <Link href="/login" className="block min-h-12 py-3 text-center text-sm font-medium text-link underline">
          Voltar ao login
        </Link>
      </div>
    );

  return (
    <form action={action} className="space-y-4" noValidate>
      <label className="block space-y-1">
        <span className="text-sm font-medium">E-mail da conta</span>
        <input name="email" type="email" autoComplete="username" inputMode="email" required className={field} />
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
        {pending ? 'Enviando…' : 'Enviar link'}
      </button>
      <Link href="/login" className="block min-h-12 py-3 text-center text-sm font-medium text-link underline">
        Voltar ao login
      </Link>
    </form>
  );
}
