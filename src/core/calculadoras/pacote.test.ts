import { describe, expect, it } from 'vitest';
import { compararPropostas, fgtsAnual, quantoVale } from './pacote';
import { T2026 } from './fixtures.test-helpers';

describe('quanto vale meu pacote', () => {
  const p = quantoVale({ brutoCents: 1_000_000, beneficios: [{ nome: 'VR', mensalCents: 80_000 }] }, T2026);
  it('12 salários + 13º + 1/3 de férias + FGTS + benefícios', () => {
    expect(p.liquidoMensalCents).toBe(744_236);
    expect(p.linhas.map((l) => [l.rotulo, l.anualCents])).toEqual([
      ['12 salários líquidos', 8_930_832],
      ['13º líquido', 744_236],
      ['1/3 de férias líquido', 241_666],
      ['FGTS (8%)', 1_066_667],
      ['VR', 960_000],
    ]);
    expect(p.totalAnualCents).toBe(11_943_401);
    expect(p.equivalenteMensalCents).toBe(995_283);
  });
  it('FGTS incide sobre 12 salários, 13º e 1/3 de férias', () => expect(fgtsAnual(300_000)).toBe(320_000));
  it('desconto de VR reduz só os 12 salários', () => {
    const com = quantoVale({ brutoCents: 1_000_000, descontoVrPercent: 1 }, T2026);
    const sem = quantoVale({ brutoCents: 1_000_000 }, T2026);
    expect(sem.totalAnualCents - com.totalAnualCents).toBe(10_000 * 12);
  });
  it('benefício zerado e PLR ausente não viram linha', () => {
    const q = quantoVale({ brutoCents: 500_000, beneficios: [{ nome: 'VA', mensalCents: 0 }] }, T2026);
    expect(q.linhas.map((l) => l.rotulo)).not.toContain('VA');
    expect(q.linhas).toHaveLength(4);
  });
});

describe('simulador de proposta', () => {
  it('desconta o custo de deslocamento de cada lado', () => {
    const r = compararPropostas(
      { brutoCents: 1_000_000 },
      { brutoCents: 1_000_000, custoMensalCents: 50_000 },
      T2026,
    );
    expect(r.diferencaAnualCents).toBe(-600_000);
    expect(r.diferencaMensalCents).toBe(-50_000);
  });
  it('variação % sobre o pacote atual', () => {
    const r = compararPropostas({ brutoCents: 500_000 }, { brutoCents: 600_000 }, T2026);
    expect(r.diferencaAnualCents).toBeGreaterThan(0);
    expect(r.variacaoPct).toBeGreaterThan(10);
    expect(r.variacaoPct).toBeLessThan(20);
  });
});
