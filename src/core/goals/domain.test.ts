import { describe, expect, it } from 'vitest';
import {
  aporteNecessario,
  coberturaEmMeses,
  mediaGastoMensal,
  mesesParaAtingir,
  progressoPct,
} from './domain';

describe('metas e reserva', () => {
  it('cobertura em meses', () => expect(coberturaEmMeses(3_000_000, 600_000)).toBe(5));
  it('cobertura sem gastos é 0', () => expect(coberturaEmMeses(100, 0)).toBe(0));
  it('média de gastos', () => expect(mediaGastoMensal([100, 200, 300])).toBe(200));
  it('progresso limitado a 100%', () =>
    expect(progressoPct({ currentCents: 150, targetCents: 100 })).toBe(100));
  it('meses para atingir no ritmo do aporte', () => {
    expect(
      mesesParaAtingir({
        currentCents: 100_000,
        targetCents: 1_000_000,
        plannedMonthlyCents: 200_000,
      }),
    ).toBe(5);
    expect(
      mesesParaAtingir({ currentCents: 0, targetCents: 100, plannedMonthlyCents: null }),
    ).toBeNull();
  });
  it('aporte necessário até o prazo', () => {
    expect(
      aporteNecessario(
        { currentCents: 0, targetCents: 1_200_000, deadline: '2027-11-12' },
        '2026-11-12',
      ),
    ).toBe(100_000);
  });
});
