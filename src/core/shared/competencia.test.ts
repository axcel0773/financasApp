import { describe, expect, it } from 'vitest';
import { addDias, addMeses, dataNoMes, diasNoMes, diffDias, isIsoDate } from './competencia';

describe('competencia', () => {
  it('soma meses atravessando o ano', () => {
    expect(addMeses('2026-11', 3)).toBe('2027-02');
    expect(addMeses('2026-01', -1)).toBe('2025-12');
  });
  it('dias no mês (bissexto)', () => {
    expect(diasNoMes('2028-02')).toBe(29);
    expect(diasNoMes('2026-02')).toBe(28);
  });
  it('limita o dia ao fim do mês', () => {
    expect(dataNoMes('2026-02', 31)).toBe('2026-02-28');
    expect(dataNoMes('2026-11', 5)).toBe('2026-11-05');
  });
  it('datas', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(addDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDias('2026-11-12', '2026-12-05')).toBe(23);
  });
});
