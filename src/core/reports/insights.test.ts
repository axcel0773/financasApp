import { describe, expect, it } from 'vitest';
import { gerarInsights, type EntradaInsights } from './insights';

const base: EntradaInsights = {
  hoje: '2026-11-10',
  mes: '2026-11',
  atual: [
    { categoryId: 'a', cents: 60000 },
    { categoryId: 'b', cents: 30000 },
    { categoryId: null, cents: 10000 },
  ],
  anteriores: [
    { categoryId: 'a', cents: 30000, competencia: '2026-10' },
    { categoryId: 'a', cents: 30000, competencia: '2026-09' },
    { categoryId: 'b', cents: 30000, competencia: '2026-10' },
    { categoryId: 'b', cents: 30000, competencia: '2026-09' },
  ],
  categorias: [{ id: 'a', name: 'Restaurantes' }, { id: 'b', name: 'Mercado' }],
  fixosCents: 200000,
  rendaCents: 800000,
};

describe('gerarInsights', () => {
  it('projeta o mês corrente pelo ritmo diário', () => {
    const r = gerarInsights(base);
    expect(r.projecao).toMatchObject({ gastoAteHojeCents: 100000, diasDecorridos: 10, diasNoMes: 30, projecaoCents: 300000 });
  });
  it('não projeta mês passado', () => {
    expect(gerarInsights({ ...base, mes: '2026-10' }).projecao).toBeNull();
  });
  it('aponta categoria em alta contra a média dos meses anteriores', () => {
    const r = gerarInsights(base);
    expect(r.emAlta).toHaveLength(1);
    expect(r.emAlta[0]).toMatchObject({ nome: 'Restaurantes', mediaCents: 30000, deltaCents: 30000 });
  });
  it('sem histórico não acusa alta', () => {
    expect(gerarInsights({ ...base, anteriores: [] }).emAlta).toEqual([]);
  });
  it('ordena os maiores e calcula economia de 10% e 20%', () => {
    const r = gerarInsights(base);
    expect(r.maiores[0]).toMatchObject({ nome: 'Restaurantes', pct: 60 });
    expect(r.economias[0]).toEqual({ nome: 'Restaurantes', mensal10Cents: 6000, mensal20Cents: 12000, anual20Cents: 144000 });
  });
  it('mede o peso dos fixos na renda', () => {
    expect(gerarInsights(base).fixosPctRenda).toBe(25);
    expect(gerarInsights({ ...base, rendaCents: null }).fixosPctRenda).toBeNull();
  });
});
