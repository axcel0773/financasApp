import { describe, expect, it } from 'vitest';
import { agruparFaturas, competenciaDaFatura, vencimentoDaFatura } from './domain';

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
