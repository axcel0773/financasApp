import { describe, expect, it } from 'vitest';
import { formatBRL, parseBRL, splitInstallments, percentOf } from './money';

describe('parseBRL', () => {
  it.each([
    ['10.000,00', 1_000_000],
    ['R$ 1.234,56', 123_456],
    ['12,5', 1250],
    ['1234.56', 123_456],
    ['0,99', 99],
    ['-50,00', -5000],
  ])('%s -> %i', (input, expected) => {
    const r = parseBRL(input);
    expect(r.ok && r.value).toBe(expected);
  });
  it('rejeita lixo', () => {
    expect(parseBRL('abc').ok).toBe(false);
    expect(parseBRL('1,234,5').ok).toBe(false);
  });
});

describe('formatBRL', () => {
  it('formata centavos', () => expect(formatBRL(1_000_000)).toBe('R$ 10.000,00'));
});

describe('splitInstallments', () => {
  it('soma sempre o total', () => {
    const parts = splitInstallments(10_000, 3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10_000);
  });
  it('resto inteiro na 1ª parcela', () => {
    expect(splitInstallments(10_001, 3)).toEqual([3335, 3333, 3333]);
    expect(splitInstallments(9_000, 3)).toEqual([3000, 3000, 3000]);
  });
  it('rejeita n inválido', () => expect(() => splitInstallments(100, 0)).toThrow());
});

describe('percentOf', () => {
  it('arredonda em centavos', () => expect(percentOf(100_000, 7.5)).toBe(7500));
});
