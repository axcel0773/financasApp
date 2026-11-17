import type { Cents } from '../shared/money';
import { calcularIrrf } from '../income/holerite';
import { quantoVale, type EntradaPacote, type TabelasFiscais } from './pacote';
import type { ParametrosAno } from './parametros';

interface FaixaSimples {
  ateCents: Cents | null;
  nominal: number;
  deduzirCents: Cents;
}

/** Simples Nacional, LC 123/2006 (redação da LC 155/2016), sem mudança em 2026. */
export const ANEXO_III: FaixaSimples[] = [
  { ateCents: 18_000_000, nominal: 0.06, deduzirCents: 0 },
  { ateCents: 36_000_000, nominal: 0.112, deduzirCents: 936_000 },
  { ateCents: 72_000_000, nominal: 0.135, deduzirCents: 1_764_000 },
  { ateCents: 180_000_000, nominal: 0.16, deduzirCents: 3_564_000 },
  { ateCents: 360_000_000, nominal: 0.21, deduzirCents: 12_564_000 },
  { ateCents: 480_000_000, nominal: 0.33, deduzirCents: 64_800_000 },
];
export const ANEXO_V: FaixaSimples[] = [
  { ateCents: 18_000_000, nominal: 0.155, deduzirCents: 0 },
  { ateCents: 36_000_000, nominal: 0.18, deduzirCents: 450_000 },
  { ateCents: 72_000_000, nominal: 0.195, deduzirCents: 990_000 },
  { ateCents: 180_000_000, nominal: 0.205, deduzirCents: 1_710_000 },
  { ateCents: 360_000_000, nominal: 0.23, deduzirCents: 6_210_000 },
  { ateCents: 480_000_000, nominal: 0.305, deduzirCents: 54_000_000 },
];
/** Teto do Simples Nacional (receita bruta em 12 meses). */
export const TETO_SIMPLES_CENTS = 480_000_000;
/** Fator R mínimo (folha ÷ receita) para o serviço sair do Anexo V e ir para o III. */
export const FATOR_R = 0.28;
/** INSS do sócio sobre o pró-labore (contribuinte individual), limitado ao teto. */
const INSS_PRO_LABORE = 0.11;

/** Alíquota efetiva = (RBT12 × nominal − parcela a deduzir) ÷ RBT12. */
export function aliquotaEfetiva(rbt12Cents: Cents, anexo: FaixaSimples[]): number {
  const faixa = anexo.find((f) => f.ateCents === null || rbt12Cents <= f.ateCents) ?? anexo[anexo.length - 1]!;
  if (rbt12Cents <= 0) return anexo[0]!.nominal;
  return Math.max(0, (rbt12Cents * faixa.nominal - faixa.deduzirCents) / rbt12Cents);
}

export interface EntradaRegimes {
  /** Faturamento mensal como PJ ou MEI. */
  faturamentoMensalCents: Cents;
  /** Meses faturados por ano (PJ não tem férias pagas). */
  mesesFaturados: number;
  /** Contador e outros custos fixos mensais da empresa. */
  custoPjMensalCents: Cents;
  /** Gastos que a empresa CLT pagava e como PJ saem do seu bolso (plano de saúde, por exemplo), por mês. */
  custosProprioMensalCents: Cents;
  clt: EntradaPacote;
}

export interface ResultadoPj {
  anexo: 'III' | 'V';
  proLaboreCents: Cents;
  dasMensalCents: Cents;
  aliquotaPct: number;
  inssMensalCents: Cents;
  irrfMensalCents: Cents;
  liquidoMensalCents: Cents;
  liquidoAnualCents: Cents;
}

export interface ResultadoRegimes {
  cltAnualCents: Cents;
  mei: { cabe: boolean; dasMensalCents: Cents; liquidoAnualCents: Cents };
  pj: ResultadoPj;
  /** Alternativa de anexo que perdeu (para mostrar a diferença). */
  pjOutro: ResultadoPj;
  melhor: 'clt' | 'pj' | 'mei';
  /** Faturamento PJ mensal que empata com o pacote CLT (null se fora do Simples). */
  empatePjMensalCents: Cents | null;
}

function simularPj(
  fat: Cents,
  meses: number,
  anexo: 'III' | 'V',
  e: Pick<EntradaRegimes, 'custoPjMensalCents' | 'custosProprioMensalCents'>,
  t: TabelasFiscais,
  p: ParametrosAno,
): ResultadoPj {
  const tetoInss = [...t.inss].reverse().find((f) => f.upToCents !== null)?.upToCents ?? Number.POSITIVE_INFINITY;
  const proLaboreCents =
    anexo === 'III' ? Math.max(p.salarioMinimoCents, Math.ceil(Math.round(fat * FATOR_R * 1000) / 1000)) : p.salarioMinimoCents;
  const aliquota = aliquotaEfetiva(fat * meses, anexo === 'III' ? ANEXO_III : ANEXO_V);
  const dasMensalCents = Math.round(fat * aliquota);
  const inssMensalCents = Math.round(Math.min(proLaboreCents, tetoInss) * INSS_PRO_LABORE);
  const irrfMensalCents = calcularIrrf({
    grossCents: proLaboreCents,
    inssCents: inssMensalCents,
    dependentes: 0,
    faixas: t.irrf,
    params: t.paramsIrrf,
  });
  // o lucro que sobra depois do DAS e do pró-labore é distribuído sem IR (dividendos abaixo de R$ 50 mil/mês)
  const liquidoMensalCents =
    fat - dasMensalCents - inssMensalCents - irrfMensalCents - e.custoPjMensalCents - e.custosProprioMensalCents;
  // nos meses sem faturar, os custos fixos continuam
  const liquidoAnualCents =
    liquidoMensalCents * meses - (e.custoPjMensalCents + e.custosProprioMensalCents) * (12 - meses);
  return { anexo, proLaboreCents, dasMensalCents, aliquotaPct: aliquota * 100, inssMensalCents, irrfMensalCents, liquidoMensalCents, liquidoAnualCents };
}

/** Melhor anexo para o faturamento: III com pró-labore de 28% ou V com pró-labore de um mínimo. */
function melhorPj(fat: Cents, e: EntradaRegimes, t: TabelasFiscais, p: ParametrosAno) {
  const meses = Math.min(12, Math.max(1, Math.round(e.mesesFaturados)));
  const iii = simularPj(fat, meses, 'III', e, t, p);
  const v = simularPj(fat, meses, 'V', e, t, p);
  return iii.liquidoAnualCents >= v.liquidoAnualCents ? { melhor: iii, outro: v } : { melhor: v, outro: iii };
}

/**
 * CLT × PJ (Simples Nacional, serviço com Fator R) × MEI, em dinheiro líquido por ano.
 * Estimativa: sem ISS fora do DAS, sem IRPF anual de ajuste e sem aposentadoria comparada.
 */
export function compararRegimes(e: EntradaRegimes, t: TabelasFiscais, p: ParametrosAno): ResultadoRegimes {
  const fat = Math.max(0, e.faturamentoMensalCents);
  const meses = Math.min(12, Math.max(1, Math.round(e.mesesFaturados)));
  const cltAnualCents = quantoVale(e.clt, t).totalAnualCents;
  const { melhor: pj, outro: pjOutro } = melhorPj(fat, e, t, p);

  const cabe = fat * meses <= p.limiteMeiAnualCents;
  const meiAnual = fat * meses - p.dasMeiServicosCents * 12 - e.custosProprioMensalCents * 12;

  const opcoes: { k: 'clt' | 'pj' | 'mei'; v: Cents }[] = [
    { k: 'clt', v: cltAnualCents },
    { k: 'pj', v: pj.liquidoAnualCents },
  ];
  if (cabe) opcoes.push({ k: 'mei', v: meiAnual });
  const melhor = opcoes.reduce((a, b) => (b.v > a.v ? b : a)).k;

  // busca binária do faturamento em que o PJ empata com o CLT
  let empatePjMensalCents: Cents | null = null;
  const tetoMensal = Math.floor(TETO_SIMPLES_CENTS / meses);
  if (melhorPj(tetoMensal, e, t, p).melhor.liquidoAnualCents >= cltAnualCents) {
    let lo = 0;
    let hi = tetoMensal;
    while (hi - lo > 100) {
      const mid = Math.floor((lo + hi) / 2);
      if (melhorPj(mid, e, t, p).melhor.liquidoAnualCents >= cltAnualCents) hi = mid;
      else lo = mid;
    }
    empatePjMensalCents = Math.ceil(hi / 100) * 100;
  }

  return {
    cltAnualCents,
    mei: { cabe, dasMensalCents: p.dasMeiServicosCents, liquidoAnualCents: meiAnual },
    pj,
    pjOutro,
    melhor,
    empatePjMensalCents,
  };
}
