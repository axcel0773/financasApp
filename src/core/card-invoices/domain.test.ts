import { describe, expect, it } from 'vitest';
import { agruparFaturas, competenciaDaFatura, maiorCompra, usoDoLimite, vencimentoDaFatura } from './domain';

describe('fatura do cartão', () => {
  it('fechamento dia 25: compra no dia 25 fica na fatura do mês, no 26 vai para a seguinte', () => {
    expect(competenciaDaFatura('2026-11-25', 25)).toBe('2026-11');
    expect(competenciaDaFatura('2026-11-26', 25)).toBe('2026-12');
    expect(competenciaDaFatura('2026-12-30', 25)).toBe('2027-01');
  });
  it('vencimento: dia 5 com fechamento 25 vence no mês seguinte; dia 28 vence no mesmo mês', () => {
    expect(vencimentoDaFatura('2026-11', 25, 5)).toBe('2026-12-05');
    expect(vencimentoDaFatura('2026-11', 20, 28)).toBe('2026-11-28');
  });
  it('agrupa e soma por fatura', () => {
    const f = agruparFaturas(
      [
        { id: 'a', date: '2026-11-10', amountCents: 1000 },
        { id: 'b', date: '2026-11-25', amountCents: 500 },
        { id: 'c', date: '2026-11-26', amountCents: 700 },
      ],
      25,
      5,
    );
    expect(f.map((x) => [x.competencia, x.totalCents, x.venceEm])).toEqual([
      ['2026-11', 1500, '2026-12-05'],
      ['2026-12', 700, '2027-01-05'],
    ]);
  });
});


describe('uso do limite', () => {
  const fat = (venceEm: string, totalCents: number) => ({ competencia: venceEm.slice(0, 7), fechaEm: venceEm, venceEm, totalCents, compras: [] });
  it('soma só as faturas que ainda não venceram', () => {
    const r = usoDoLimite([fat('2026-11-05', 50_000), fat('2026-12-05', 30_000), fat('2027-01-05', 10_000)], '2026-11-16', 100_000);
    expect(r).toEqual({ emAbertoCents: 40_000, disponivelCents: 60_000, usadoPct: 40 });
  });
  it('fatura que vence hoje ainda ocupa o limite', () => {
    expect(usoDoLimite([fat('2026-11-16', 1_000)], '2026-11-16', 10_000).emAbertoCents).toBe(1_000);
  });
  it('sem limite informado: só o em aberto', () => {
    expect(usoDoLimite([fat('2026-12-05', 30_000)], '2026-11-16', null)).toEqual({ emAbertoCents: 30_000, disponivelCents: null, usadoPct: null });
  });
  it('disponível nunca fica negativo', () => {
    expect(usoDoLimite([fat('2026-12-05', 130_000)], '2026-11-16', 100_000).disponivelCents).toBe(0);
  });
  it('maior compra', () => {
    const c = (id: string, amountCents: number) => ({ id, date: '2026-11-01', amountCents });
    expect(maiorCompra([c('a', 10), c('b', 30), c('c', 30)])?.id).toBe('b');
    expect(maiorCompra([])).toBeNull();
  });
});
