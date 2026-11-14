'use client';

import type { InputHTMLAttributes } from 'react';
import { formatarCentavos } from '@/core/shared/money';
import { FIELD } from './fields-base';
import { cx } from '../cx';

/** Campo de valor em reais ("1.234,56"), com máscara automática de centavos. O servidor converte para centavos com parseBRL. */
export function MoneyInput({ className, onInput, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      placeholder="0,00"
      {...p}
      className={cx(FIELD, className)}
      onInput={(e) => {
        const el = e.currentTarget;
        const f = formatarCentavos(el.value);
        if (f !== el.value) el.value = f;
        onInput?.(e);
      }}
    />
  );
}
