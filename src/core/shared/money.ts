import { err, ok, type Result } from './result';

/** Dinheiro SEMPRE em centavos (inteiro). Nunca use float para valores. */
export type Cents = number;

export type MoneyError = 'invalid_format' | 'not_safe_integer';

/** Converte "1.234,56" / "1234,56" / "1234.56" em centavos. */
export function parseBRL(input: string): Result<Cents, MoneyError> {
  const s = input.replace(/[R$\s]/g, '');
  if (!/^-?(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$|^-?\d+\.\d{1,2}$/.test(s))
    return err('invalid_format');
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const negative = normalized.startsWith('-');
  const [int = '0', frac = ''] = normalized.replace('-', '').split('.');
  const cents = Number(int) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) return err('not_safe_integer');
  return ok(negative ? -cents : cents);
}

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(cents / 100)
    .replace(/ /g, ' ');
}

/** Divide em n parcelas sem perder nem criar centavo: o resto vai para a 1ª parcela. */
export function splitInstallments(total: Cents, n: number): Cents[] {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n deve ser inteiro >= 1');
  const base = Math.trunc(total / n);
  const rest = total - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + rest : base));
}

/** Percentual com arredondamento bancário simples (half up), em centavos. */
export function percentOf(value: Cents, percent: number): Cents {
  return Math.round((value * percent) / 100);
}

/**
 * Máscara de digitação: só números, as casas se formam sozinhas da direita para a esquerda
 * (1 → 0,01 · 12345 → 123,45 · 1234567 → 12.345,67). Um "-" no início é mantido (saldo negativo).
 */
export function formatarCentavos(bruto: string): string {
  const negativo = bruto.trim().startsWith('-');
  const digitos = bruto.replace(/\D/g, '').replace(/^0+/, '');
  if (!digitos) return negativo ? '-' : '';
  const n = digitos.padStart(3, '0');
  const inteiro = n.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}${inteiro},${n.slice(-2)}`;
}
