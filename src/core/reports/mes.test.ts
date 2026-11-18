import { describe, expect, it } from 'vitest';
import { comoEstaMes } from './mes';

const base = {
  hoje: '2026-11-18',
  mes: '2026-11',
  rendaCents: 742_000,
  gastos: [
    { cents: 185_000, comprometido: true }, // aluguel já lançado
    { cents: 173_000, comprometido: false }, // dia a dia até o dia 18
  ],
  fixosPendentesCents: 80_000,
  metaPct: 20,
};

describe('como está o mês', () => {
  it('projeta o dia a dia no mês corrente e soma os fixos do mês inteiro', () => {
    const r = comoEstaMes(base);
    expect(r.projetado).toBe(true);
    expect(r.fixosCents).toBe(265_000);
    expect(r.diaADiaFimCents).toBe(288_333); // 1730 ÷ 18 × 30
    expect(r.custoDeVidaCents).toBe(553_333);
    expect(r.sobraFimCents).toBe(188_667);
    expect(r.poupancaPct).toBeCloseTo(25.43, 1);
    expect(r.mediaDiariaCents).toBe(9_611);
    expect(r.metaCents).toBe(148_400);
    expect(r.limiteDiarioCents).toBe(10_953); // (7420 − 2650 − 1484) ÷ 30
    expect(r.diasRestantes).toBe(12);
    expect(r.podePorDiaCents).toBe(12_967); // (3286 − 1730) ÷ 12
  });

  it('mês passado usa os valores lançados, sem projeção', () => {
    const r = comoEstaMes({ ...base, mes: '2026-10', fixosPendentesCents: 0 });
    expect(r.projetado).toBe(false);
    expect(r.diasDecorridos).toBe(31);
    expect(r.diaADiaFimCents).toBe(173_000);
    expect(r.podePorDiaCents).toBeNull();
  });

  it('sem renda não calcula percentual nem limite', () => {
    const r = comoEstaMes({ ...base, rendaCents: 0 });
    expect(r.poupancaPct).toBeNull();
    expect(r.limiteDiarioCents).toBeNull();
    expect(r.podePorDiaCents).toBeNull();
    expect(r.sobraFimCents).toBe(-553_333);
  });

  it('acima do ritmo, o que dá por dia fica negativo e o limite nunca é negativo', () => {
    const r = comoEstaMes({ ...base, gastos: [{ cents: 600_000, comprometido: false }] });
    expect(r.podePorDiaCents).toBeLessThan(0);
    const sem = comoEstaMes({ ...base, rendaCents: 100_000 });
    expect(sem.limiteDiarioCents).toBe(0);
  });
});
