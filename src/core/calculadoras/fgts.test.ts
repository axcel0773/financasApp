import { describe, expect, it } from 'vitest';
import { compararSaqueFgts, saqueAniversario } from './fgts';

describe('saque-aniversário', () => {
  it.each([
    [40_000, 20_000],
    [100_000, 45_000],
    [500_000, 165_000],
    [800_000, 225_000],
    [3_000_000, 440_000],
    [0, 0],
  ])('saldo %i → saque %i', (saldo, saque) => expect(saqueAniversario(saldo)).toBe(saque));
});

describe('aniversário × rescisão', () => {
  const r = compararSaqueFgts({ saldoCents: 800_000, brutoCents: 500_000, anos: 3, rendimentoAnualPct: 3 });
  it('ano 1: saca R$ 2.250 e o restante rende e recebe depósitos', () => {
    expect(r[0]!.sacadoNoAnoCents).toBe(225_000);
    expect(r[0]!.saldoAniversarioCents).toBe(Math.round(575_000 * 1.03) + 533_333);
  });
  it('demitido no aniversário recebe só a multa de 40% além do que já sacou', () => {
    const multa = Math.round((800_000 + 533_333) * 0.4);
    expect(r[0]!.demitidoAniversarioCents).toBe(225_000 + multa);
    expect(r[0]!.demitidoRescisaoCents).toBe(r[0]!.saldoRescisaoCents + multa);
  });
  it('o saldo preso cresce menos que o da rescisão', () =>
    expect(r[2]!.saldoAniversarioCents).toBeLessThan(r[2]!.saldoRescisaoCents));
});
