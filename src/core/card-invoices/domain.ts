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
