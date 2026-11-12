import { describe, expect, it } from 'vitest';
import { gerarParcelas } from './domain';

describe('parcelas', () => {
  it('soma o total exato e põe o resto na 1ª', () => {
    const p = gerarParcelas(10_001, 3, '2026-11-12');
    expect(p.map((x) => x.valorCents)).toEqual([3335, 3333, 3333]);
    expect(p.reduce((s, x) => s + x.valorCents, 0)).toBe(10_001);
  });
  it('datas mês a mês, com dia 31 limitado ao fim do mês', () => {
    const p = gerarParcelas(3_000, 3, '2026-01-31');
    expect(p.map((x) => x.data)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });
});
