import { describe, expect, it } from 'vitest';
import { ANEXO_III, ANEXO_V, aliquotaEfetiva, compararRegimes } from './regimes';
import { parametrosDoAno } from './parametros';
import { T2026 } from './fixtures.test-helpers';

const P = parametrosDoAno(2026);
const base = { mesesFaturados: 11, custoPjMensalCents: 30_000, custosProprioMensalCents: 0, clt: { brutoCents: 1_000_000 } };

describe('Simples Nacional', () => {
  it('alíquota efetiva do Anexo III com RBT12 de R$ 420 mil é 9,3%', () =>
    expect(aliquotaEfetiva(42_000_000, ANEXO_III)).toBeCloseTo(0.093, 6));
  it('alíquota efetiva do Anexo V com RBT12 de R$ 300 mil é 16,5%', () =>
    expect(aliquotaEfetiva(30_000_000, ANEXO_V)).toBeCloseTo(0.165, 6));
  it('até R$ 180 mil vale a alíquota nominal', () => expect(aliquotaEfetiva(10_000_000, ANEXO_III)).toBe(0.06));
});

describe('CLT × PJ × MEI', () => {
  const r = compararRegimes({ ...base, faturamentoMensalCents: 1_500_000 }, T2026, P);
  it('PJ no Anexo III com pró-labore de 28%', () => {
    expect(r.pj.anexo).toBe('III');
    expect(r.pj.proLaboreCents).toBe(420_000);
    expect(r.pj.dasMensalCents).toBe(90_000);
    expect(r.pj.inssMensalCents).toBe(46_200);
    expect(r.pj.irrfMensalCents).toBe(0);
    expect(r.pj.liquidoMensalCents).toBe(1_500_000 - 90_000 - 46_200 - 30_000);
    // 11 meses faturados e o contador também no mês sem faturar
    expect(r.pj.liquidoAnualCents).toBe(1_333_800 * 11 - 30_000);
  });
  it('o Anexo V perde quando o Fator R é atingido', () => {
    expect(r.pjOutro.anexo).toBe('V');
    expect(r.pjOutro.liquidoAnualCents).toBeLessThan(r.pj.liquidoAnualCents);
  });
  it('MEI não cabe acima de R$ 81 mil por ano', () => expect(r.mei.cabe).toBe(false));
  it('CLT de R$ 10 mil vale R$ 109.834,01 por ano sem benefícios', () => expect(r.cltAnualCents).toBe(10_983_401));
  it('faturamento de empate fica entre o bruto CLT e o faturamento simulado', () => {
    expect(r.empatePjMensalCents).toBeGreaterThan(1_000_000);
    expect(r.empatePjMensalCents).toBeLessThan(1_500_000);
    const no = compararRegimes({ ...base, faturamentoMensalCents: r.empatePjMensalCents! }, T2026, P);
    expect(no.pj.liquidoAnualCents).toBeGreaterThanOrEqual(no.cltAnualCents);
  });
  it('MEI cabe com R$ 6 mil por mês e paga o DAS fixo', () => {
    const m = compararRegimes({ ...base, mesesFaturados: 12, faturamentoMensalCents: 600_000 }, T2026, P);
    expect(m.mei.cabe).toBe(true);
    expect(m.mei.dasMensalCents).toBe(8_605);
    expect(m.mei.liquidoAnualCents).toBe(600_000 * 12 - 8_605 * 12);
  });
});

describe('parâmetros por ano', () => {
  it('ano sem cadastro usa o mais recente e avisa', () => {
    const p = parametrosDoAno(2030);
    expect(p.ano).toBe(2026);
    expect(p.desatualizado).toBe(true);
  });
  it('2026: mínimo de R$ 1.621', () => expect(parametrosDoAno(2026).salarioMinimoCents).toBe(162_100));
});
