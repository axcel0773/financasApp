'use client';

import type { InputHTMLAttributes } from 'react';
import { FIELD } from './fields-base';
import { cx } from '../cx';

/** Digita só números: as casas se formam sozinhas, da direita para a esquerda (1 → 0,01 · 12345 → 123,45 · 1234567 → 12.345,67). */
export function formatarCentavos(bruto: string): string {
  const negativo = bruto.trim().startsWith('-');
  const digitos = bruto.replace(/\D/g, '').replace(/^0+/, '');
  if (!digitos) return '';
  const n = digitos.padStart(3, '0');
  const inteiro = n.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}${inteiro},${n.slice(-2)}`;
}

/** Campo de valor em reais ("1.234,56"). O servidor converte para centavos com parseBRL. */
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
