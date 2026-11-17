import { describe, expect, it } from 'vitest';
import { compararAquisicao } from './aquisicao';
import { simularCenario } from './cenario';
import { descreverTempo, precoEmTempo, valorDaHora } from './horas';

describe('preço em horas de trabalho', () => {
  it('44 h por semana = 220 h por mês', () => expect(valorDaHora(880_000, 44)).toBe(4_000));
  it('R$ 4.800 com R$ 8.800 líquidos e 40 h por semana custam 13,6 dias', () => {
    const t = precoEmTempo(480_000, 880_000, 40)!;
    expect(t.horas).toBeCloseTo(109.09, 2);
    expect(descreverTempo(t)).toBe('13,6 dias');
  });
  it('textos curtos por escala', () => {
    expect(descreverTempo(precoEmTempo(2_000, 880_000, 44)!)).toBe('30 min');
    expect(descreverTempo(precoEmTempo(20_000, 880_000, 44)!)).toBe('5 h');
    expect(descreverTempo(precoEmTempo(1_320_000, 880_000, 44)!)).toBe('1,5 mês');
  });
  it('sem renda não há conta', () => expect(precoEmTempo(10_000, 0, 44)).toBeNull());
});

describe('simulador "e se"', () => {
  const base = { rendaCents: 700_000, gastoCents: 500_000, reservaCents: 1_000_000, rendimentoMensalPct: 0, variacaoGastoPct: 0, gastoExtraCents: 0, meses: 6 };
  it('perder a renda: a reserva cobre 2 meses e acaba no 3º', () => {
    const r = simularCenario({ ...base, rendaNoCenarioCents: 0, duracaoMeses: null });
    expect(r.coberturaMeses).toBe(2);
    expect(r.mesQueAcaba).toBe(3);
  });
  it('cenário temporário volta à renda de hoje depois', () => {
    const r = simularCenario({ ...base, rendaNoCenarioCents: 0, duracaoMeses: 2 });
    expect(r.mesQueAcaba).toBeNull();
    expect(r.linhas[2]!.saldoReservaCents).toBe(200_000);
  });
  it('corte de 20% nos gastos e uma parcela nova', () => {
    const r = simularCenario({ ...base, rendaNoCenarioCents: 700_000, duracaoMeses: null, variacaoGastoPct: -20, gastoExtraCents: 135_000 });
    expect(r.sobraNoCenarioCents).toBe(700_000 - 400_000 - 135_000);
    expect(r.coberturaMeses).toBeNull();
  });
  it('a reserva rende só enquanto é positiva', () => {
    const r = simularCenario({ ...base, rendaNoCenarioCents: 700_000, duracaoMeses: null, rendimentoMensalPct: 1, meses: 1 });
    expect(r.linhas[0]!.saldoReservaCents).toBe(1_010_000 + 200_000);
  });
});

describe('comprar × alugar × assinar', () => {
  const r = compararAquisicao({
    horizonteMeses: 24,
    rendimentoAnualPct: 12,
    comprar: { precoCents: 500_000, manutencaoMensalCents: 0, revendaPct: 50 },
    alugar: { mensalCents: 15_000, reajusteAnualPct: 0 },
    assinar: { mensalCents: 12_000 },
  });
  it('comprar: preço menos a revenda trazida a valor de hoje', () => {
    const comprar = r.opcoes.find((o) => o.opcao === 'comprar')!;
    expect(comprar.custoCents).toBe(Math.round(500_000 - 250_000 / 1.12 ** 2));
  });
  it('vence a opção de menor custo em dinheiro de hoje', () => expect(r.melhor).toBe('assinar'));
  it('reajuste anual do aluguel a partir do 13º mês', () => {
    const a = compararAquisicao({ horizonteMeses: 13, rendimentoAnualPct: 0, alugar: { mensalCents: 10_000, reajusteAnualPct: 10 } });
    expect(a.opcoes[0]!.totalPagoCents).toBe(10_000 * 12 + 11_000);
  });
  it('sem opções preenchidas não há vencedora', () => expect(compararAquisicao({ horizonteMeses: 12, rendimentoAnualPct: 10 }).melhor).toBeNull());
});
