import { describe, expect, it } from 'vitest';
import {
  alocacaoPorTipo,
  calcularRendimento,
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
