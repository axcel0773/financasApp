import {
  addMeses,
  competenciaDe,
  dataNoMes,
  type Competencia,
  type IsoDate,
} from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface CompraCartao {
  id: string;
  date: IsoDate;
  amountCents: Cents;
}
export interface Fatura {
  competencia: Competencia;
  fechaEm: IsoDate;
  venceEm: IsoDate;
  totalCents: Cents;
  compras: CompraCartao[];
}

/** Compra até o dia de fechamento entra na fatura que fecha neste mês; depois, na do mês seguinte. */
export function competenciaDaFatura(dataCompra: IsoDate, diaFechamento: number): Competencia {
  const c = competenciaDe(dataCompra);
  return dataCompra > dataNoMes(c, diaFechamento) ? addMeses(c, 1) : c;
}

/** Vence no mesmo mês do fechamento se o dia de vencimento for depois dele; senão, no mês seguinte. */
export function vencimentoDaFatura(
  competencia: Competencia,
  diaFechamento: number,
  diaVencimento: number,
): IsoDate {
  return dataNoMes(
    diaVencimento > diaFechamento ? competencia : addMeses(competencia, 1),
    diaVencimento,
  );
}

export function agruparFaturas(
  compras: CompraCartao[],
  diaFechamento: number,
  diaVencimento: number,
): Fatura[] {
  const mapa = new Map<Competencia, Fatura>();
  for (const c of compras) {
    const comp = competenciaDaFatura(c.date, diaFechamento);
    const f = mapa.get(comp) ?? {
      competencia: comp,
      fechaEm: dataNoMes(comp, diaFechamento),
      venceEm: vencimentoDaFatura(comp, diaFechamento, diaVencimento),
      totalCents: 0,
      compras: [],
    };
    f.totalCents += c.amountCents;
    f.compras.push(c);
    mapa.set(comp, f);
  }
  return [...mapa.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));
}

export interface UsoDoLimite {
  /** Soma das faturas que ainda não venceram (contam como limite usado). */
  emAbertoCents: Cents;
  /** null quando o cartão não tem limite informado. */
  disponivelCents: Cents | null;
  usadoPct: number | null;
}

/** Quanto do limite está tomado: toda fatura com vencimento de hoje em diante ainda ocupa o limite. */
export function usoDoLimite(faturas: Fatura[], hoje: IsoDate, limiteCents: Cents | null): UsoDoLimite {
  const emAbertoCents = faturas.filter((f) => f.venceEm >= hoje).reduce((s, f) => s + f.totalCents, 0);
  if (!limiteCents || limiteCents <= 0) return { emAbertoCents, disponivelCents: null, usadoPct: null };
  return {
    emAbertoCents,
    disponivelCents: Math.max(0, limiteCents - emAbertoCents),
    usadoPct: (emAbertoCents / limiteCents) * 100,
  };
}

/** Maior compra de uma lista (a primeira, em caso de empate); null se vazia. */
export function maiorCompra(compras: CompraCartao[]): CompraCartao | null {
  return compras.reduce<CompraCartao | null>((m, c) => (!m || c.amountCents > m.amountCents ? c : m), null);
}
