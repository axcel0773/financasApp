import { describe, expect, it } from 'vitest';
import {
  alocacaoPorTipo,
  calcularRendimento,
  calcularRendimentoMes,
  simularAportes,
  taxaMensalEquivalente,
} from './domain';

describe('rendimento', () => {
  it('valor atual − (aportes − resgates)', () => {
    const r = calcularRendimento(1_100_000, [
      { investmentId: 'i', occurredOn: '2026-01-10', amountCents: 1_000_000 },
      { investmentId: 'i', occurredOn: '2026-06-10', amountCents: 200_000 },
      { investmentId: 'i', occurredOn: '2026-08-10', amountCents: -150_000 },
    ]);
    expect(r.investidoCents).toBe(1_050_000);
    expect(r.rendimentoCents).toBe(50_000);
    expect(r.rendimentoPct).toBeCloseTo(4.7619, 3);
  });
  it('nada investido: 0%', () => expect(calcularRendimento(0, []).rendimentoPct).toBe(0));
});
describe('alocação', () => {
  it('agrupa por tipo e ordena', () => {
    const a = alocacaoPorTipo([
      { kind: 'stocks', valorCents: 100 },
      { kind: 'treasury', valorCents: 300 },
      { kind: 'stocks', valorCents: 100 },
    ]);
    expect(a.map((x) => x.kind)).toEqual(['treasury', 'stocks']);
    expect(a[0]?.pct).toBe(60);
  });
});
describe('simulador', () => {
  it('taxa mensal equivalente', () => expect(taxaMensalEquivalente(12.6825)).toBeCloseTo(0.01, 4));
  it('12 meses a ~12,68% a.a. rendem ~12,68% sobre o inicial', () => {
    const p = simularAportes({
      inicialCents: 1_000_000,
      aporteMensalCents: 0,
      meses: 12,
      taxaAnualPercent: 12.6825,
      ipcaAnualPercent: 0,
      inicio: '2026-11',
    });
    expect(Math.abs((p[11]?.saldoCents ?? 0) - 1_126_825)).toBeLessThanOrEqual(5);
  });
  it('taxa zero: apenas soma os aportes', () => {
    const p = simularAportes({
      inicialCents: 0,
      aporteMensalCents: 100_000,
      meses: 6,
      taxaAnualPercent: 0,
      ipcaAnualPercent: 0,
      inicio: '2026-11',
    });
    expect(p[5]?.saldoCents).toBe(600_000);
    expect(p[5]?.aportadoCents).toBe(600_000);
  });
  it('IPCA reduz o valor real', () => {
    const p = simularAportes({
      inicialCents: 1_000_000,
      aporteMensalCents: 0,
      meses: 12,
      taxaAnualPercent: 10,
      ipcaAnualPercent: 5,
      inicio: '2026-11',
    });
    expect(p[11]?.saldoRealCents).toBeLessThan(p[11]?.saldoCents ?? 0);
    expect(p[11]?.competencia).toBe('2027-11');
  });
});

describe('rendimento do mês', () => {
  const ini = '2026-11-01';
  const fim = '2026-11-30';
  it('desconta aportes e resgates do mês: só o que rendeu de verdade', () => {
    const r = calcularRendimentoMes(
      ['a'],
      [
        { investmentId: 'a', balanceOn: '2026-10-31', balanceCents: 1_000_000 },
        { investmentId: 'a', balanceOn: '2026-11-20', balanceCents: 1_310_000 },
      ],
      [
        { investmentId: 'a', occurredOn: '2026-09-10', amountCents: 1_000_000 },
        { investmentId: 'a', occurredOn: '2026-11-05', amountCents: 200_000 },
      ],
      ini,
      fim,
    );
    expect(r).toEqual({ rendidoCents: 110_000, movimentoCents: 200_000, considerados: 1, semReferencia: 0 });
  });
  it('investimento criado no mês com saldo inicial não rende nada', () => {
    const r = calcularRendimentoMes(
      ['a'],
      [{ investmentId: 'a', balanceOn: '2026-11-13', balanceCents: 500_000 }],
      [{ investmentId: 'a', occurredOn: '2026-11-13', amountCents: 500_000 }],
      ini,
      fim,
    );
    expect(r.rendidoCents).toBe(0);
    expect(r.considerados).toBe(1);
  });
  it('sem saldo antes do mês e com aportes antigos: fica de fora e é contado à parte', () => {
    const r = calcularRendimentoMes(
      ['a'],
      [{ investmentId: 'a', balanceOn: '2026-11-13', balanceCents: 1_200_000 }],
      [{ investmentId: 'a', occurredOn: '2026-08-01', amountCents: 1_000_000 }],
      ini,
      fim,
    );
    expect(r).toMatchObject({ rendidoCents: 0, considerados: 0, semReferencia: 1 });
  });
});
