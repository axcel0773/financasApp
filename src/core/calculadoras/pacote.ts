import type { Cents } from '../shared/money';
import { calcularDescontoVr, estimar13o, estimarFerias, estimarHolerite, type Faixa, type ParamsIrrf } from '../income/holerite';
import { FGTS_ALIQUOTA } from './parametros';

export interface TabelasFiscais {
  inss: Faixa[];
  irrf: Faixa[];
  paramsIrrf: ParamsIrrf;
}

export interface Beneficio {
  nome: string;
  /** Valor mensal pago pela empresa (VR, VA, plano de saúde, seguro…). */
  mensalCents: Cents;
}

export interface EntradaPacote {
  brutoCents: Cents;
  /** Desconto do VR em folha, % do bruto. */
  descontoVrPercent?: number;
  beneficios?: Beneficio[];
  /** PLR ou bônus já líquido, por ano. */
  plrLiquidoAnualCents?: Cents;
}

export interface LinhaPacote {
  rotulo: string;
  anualCents: Cents;
}

export interface Pacote {
  liquidoMensalCents: Cents;
  linhas: LinhaPacote[];
  totalAnualCents: Cents;
  /** Total anual ÷ 12: quanto o pacote vale por mês. */
  equivalenteMensalCents: Cents;
}

/** FGTS do ano: 8% sobre 12 salários, o 13º e o 1/3 de férias. */
export const fgtsAnual = (brutoCents: Cents): Cents =>
  Math.round(FGTS_ALIQUOTA * (brutoCents * 13 + brutoCents / 3));

/**
 * Quanto vale um pacote CLT por ano: 12 salários líquidos, 13º líquido, o 1/3 de férias líquido,
 * FGTS e benefícios. Estimativa: não considera horas extras nem reajustes no ano.
 */
export function quantoVale(e: EntradaPacote, t: TabelasFiscais): Pacote {
  const vr = calcularDescontoVr(e.brutoCents, e.descontoVrPercent ?? 0);
  const mensal = estimarHolerite({ grossCents: e.brutoCents, descontoVrCents: vr, ...t });
  const semVr = estimarHolerite({ grossCents: e.brutoCents, ...t });
  const decimo = estimar13o({ grossCents: e.brutoCents, ...t });
  const ferias = estimarFerias({ grossMensalCents: e.brutoCents, dias: 30, ...t });

  const linhas: LinhaPacote[] = [
    { rotulo: '12 salários líquidos', anualCents: mensal.netCents * 12 },
    { rotulo: '13º líquido', anualCents: decimo.primeiraCents + decimo.segundaCents },
    { rotulo: '1/3 de férias líquido', anualCents: Math.max(0, ferias.netCents - semVr.netCents) },
    { rotulo: 'FGTS (8%)', anualCents: fgtsAnual(e.brutoCents) },
  ];
  for (const b of e.beneficios ?? [])
    if (b.mensalCents > 0) linhas.push({ rotulo: b.nome, anualCents: b.mensalCents * 12 });
  if ((e.plrLiquidoAnualCents ?? 0) > 0) linhas.push({ rotulo: 'PLR / bônus', anualCents: e.plrLiquidoAnualCents! });

  const totalAnualCents = linhas.reduce((s, l) => s + l.anualCents, 0);
  return {
    liquidoMensalCents: mensal.netCents,
    linhas,
    totalAnualCents,
    equivalenteMensalCents: Math.round(totalAnualCents / 12),
  };
}

export interface ComparacaoPropostas {
  atual: Pacote;
  nova: Pacote;
  /** Diferença anual já descontando custos extras de cada lado (deslocamento, por exemplo). */
  diferencaAnualCents: Cents;
  diferencaMensalCents: Cents;
  /** Variação % do valor anual da nova sobre a atual (null se a atual é zero). */
  variacaoPct: number | null;
}

/** Proposta nova × emprego atual, com custos mensais extras de cada lado (deslocamento, estacionamento…). */
export function compararPropostas(
  atual: EntradaPacote & { custoMensalCents?: Cents },
  nova: EntradaPacote & { custoMensalCents?: Cents },
  t: TabelasFiscais,
): ComparacaoPropostas {
  const a = quantoVale(atual, t);
  const n = quantoVale(nova, t);
  const liqA = a.totalAnualCents - (atual.custoMensalCents ?? 0) * 12;
  const liqN = n.totalAnualCents - (nova.custoMensalCents ?? 0) * 12;
  const dif = liqN - liqA;
  return {
    atual: a,
    nova: n,
    diferencaAnualCents: dif,
    diferencaMensalCents: Math.round(dif / 12),
    variacaoPct: liqA > 0 ? (dif / liqA) * 100 : null,
  };
}
