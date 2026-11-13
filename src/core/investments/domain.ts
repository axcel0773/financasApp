import { addMeses, type Competencia } from '../shared/competencia';
import type { Cents } from '../shared/money';

export type TipoInvestimento =
  'fixed_income' | 'treasury' | 'stocks' | 'funds' | 'crypto' | 'other';
export interface Investimento {
  id: string;
  kind: TipoInvestimento;
  name: string;
  institution: string | null;
  annualRatePercent: number | null;
  maturityOn: string | null;
  archived: boolean;
}
export interface Aporte {
  investmentId: string;
  occurredOn: string;
  amountCents: Cents;
} // + aporte, − resgate

export interface Rendimento {
  investidoCents: Cents;
  rendimentoCents: Cents;
  rendimentoPct: number;
}

/** Rendimento = valor atual − (aportes − resgates). % sobre o investido (0 quando nada investido). */
export function calcularRendimento(valorAtualCents: Cents, aportes: Aporte[]): Rendimento {
  const investidoCents = aportes.reduce((s, a) => s + a.amountCents, 0);
  const rendimentoCents = valorAtualCents - investidoCents;
  return {
    investidoCents,
    rendimentoCents,
    rendimentoPct: investidoCents > 0 ? (rendimentoCents / investidoCents) * 100 : 0,
  };
}

export interface SaldoDia {
  investmentId: string;
  balanceOn: string;
  balanceCents: Cents;
}
export interface RendimentoMes {
  /** Quanto o dinheiro realmente rendeu no mês, já descontados aportes e resgates do mês. */
  rendidoCents: Cents;
  /** Aportes (+) e resgates (−) do mês. */
  movimentoCents: Cents;
  /** Investimentos com saldo informado no mês e antes dele; os demais não entram na conta. */
  considerados: number;
  /** Investimentos que ficaram de fora por não terem saldo registrado antes do mês. */
  semReferencia: number;
}

/**
 * Rendimento real do mês = saldo no fim do mês − saldo no começo − (aportes − resgates do mês).
 * Começo = último saldo informado antes do mês; investimento criado no próprio mês parte de zero.
 * Sem saldo informado até o fim do mês, ou sem saldo anterior apesar de aportes antigos, fica fora.
 */
export function calcularRendimentoMes(
  ids: string[],
  saldos: SaldoDia[],
  aportes: Aporte[],
  inicio: string,
  fim: string,
): RendimentoMes {
  let rendidoCents = 0;
  let movimentoCents = 0;
  let considerados = 0;
  let semReferencia = 0;
  for (const id of ids) {
    const meus = saldos.filter((x) => x.investmentId === id).sort((a, b) => (a.balanceOn < b.balanceOn ? -1 : 1));
    const movs = aportes.filter((a) => a.investmentId === id);
    const doMes = movs.filter((a) => a.occurredOn >= inicio && a.occurredOn <= fim).reduce((t, a) => t + a.amountCents, 0);
    movimentoCents += doMes;
    const final = [...meus].reverse().find((x) => x.balanceOn <= fim);
    if (!final) continue;
    const antes = [...meus].reverse().find((x) => x.balanceOn < inicio);
    const teveAporteAntes = movs.some((a) => a.occurredOn < inicio);
    if (!antes && teveAporteAntes) {
      semReferencia++;
      continue;
    }
    considerados++;
    rendidoCents += final.balanceCents - (antes?.balanceCents ?? 0) - doMes;
  }
  return { rendidoCents, movimentoCents, considerados, semReferencia };
}

export function alocacaoPorTipo(
  itens: { kind: TipoInvestimento; valorCents: Cents }[],
): { kind: TipoInvestimento; valorCents: Cents; pct: number }[] {
  const total = itens.reduce((s, i) => s + i.valorCents, 0);
  const mapa = new Map<TipoInvestimento, Cents>();
  for (const i of itens) mapa.set(i.kind, (mapa.get(i.kind) ?? 0) + i.valorCents);
  return [...mapa.entries()]
    .map(([kind, valorCents]) => ({
      kind,
      valorCents,
      pct: total > 0 ? (valorCents / total) * 100 : 0,
    }))
    .sort((a, b) => b.valorCents - a.valorCents);
}

export interface EntradaSimulador {
  inicialCents: Cents;
  aporteMensalCents: Cents;
  meses: number;
  taxaAnualPercent: number;
  ipcaAnualPercent: number;
  inicio: Competencia;
}
export interface PontoSimulacao {
  mes: number;
  competencia: Competencia;
  aportadoCents: Cents;
  saldoCents: Cents;
  saldoRealCents: Cents;
}

/** Taxa mensal equivalente à anual: (1 + a)^(1/12) − 1. Aporte no fim de cada mês. Valor real deflaciona pelo IPCA. */
export const taxaMensalEquivalente = (anualPercent: number): number =>
  Math.pow(1 + anualPercent / 100, 1 / 12) - 1;

export function simularAportes(e: EntradaSimulador): PontoSimulacao[] {
  const i = taxaMensalEquivalente(e.taxaAnualPercent);
  const pontos: PontoSimulacao[] = [];
  let saldo = e.inicialCents;
  for (let m = 1; m <= e.meses; m++) {
    saldo = saldo * (1 + i) + e.aporteMensalCents;
    pontos.push({
      mes: m,
      competencia: addMeses(e.inicio, m),
      aportadoCents: e.inicialCents + e.aporteMensalCents * m,
      saldoCents: Math.round(saldo),
      saldoRealCents: Math.round(saldo / Math.pow(1 + e.ipcaAnualPercent / 100, m / 12)),
    });
  }
  return pontos;
}
