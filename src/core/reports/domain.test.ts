import { describe, expect, it } from 'vitest';
import { compararMeses, totaisPorCategoria } from './domain';

describe('relatórios', () => {
  it('agrupa por categoria e calcula %', () => {
    const f = totaisPorCategoria(
      [
        { categoryId: 'a', cents: 300 },
        { categoryId: 'b', cents: 100 },
        { categoryId: 'a', cents: 100 },
        { categoryId: null, cents: 100 },
      ],
      [
        { id: 'a', name: 'Mercado', color: '#111111' },
        { id: 'b', name: 'Lazer', color: null },
      ],
    );
    expect(f.map((x) => [x.name, x.cents])).toEqual([
      ['Mercado', 400],
      ['Lazer', 100],
      ['Sem categoria', 100],
    ]);
    expect(f[0]?.pct).toBeCloseTo(66.667, 2);
  });
  it('compara meses', () => {
    expect(compararMeses(110, 100)).toEqual({
      atualCents: 110,
      anteriorCents: 100,
      deltaCents: 10,
      deltaPct: 10,
    });
    expect(compararMeses(50, 0).deltaPct).toBeNull();
  });
});
