'use client';

import { Icon } from '../primitives/icon';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'] as const;

/** Teclado numérico da calculadora: cada dígito entra pela direita (centavos). Só aparece em telas de toque. */
export function Keypad({ cents, onChange }: { cents: number; onChange: (c: number) => void }) {
  const toca = (k: (typeof TECLAS)[number]) => {
    if (k === 'del') return onChange(Math.floor(cents / 10));
    const next = Number(`${cents}${k}`);
    if (Number.isSafeInteger(next) && next <= 99_999_999_99) onChange(next);
  };
  return (
    <div
      className="hidden grid-cols-3 gap-2 [@media(pointer:coarse)]:grid"
      role="group"
      aria-label="Teclado numérico"
    >
      {TECLAS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => toca(k)}
          aria-label={k === 'del' ? 'Apagar' : k}
          className="flex min-h-14 items-center justify-center rounded-md border border-border bg-surface font-display text-xl font-bold active:bg-bg"
        >
          {k === 'del' ? <Icon name="backspace" /> : k}
        </button>
      ))}
    </div>
  );
}
