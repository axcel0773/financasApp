import { addMeses, competenciaDe, dataNoMes, type IsoDate } from '../shared/competencia';
import { splitInstallments, type Cents } from '../shared/money';

export interface Parcela {
  numero: number;
  valorCents: Cents;
  data: IsoDate;
}

/** Divide em centavos (resto na 1ª parcela) e espalha as datas mês a mês, mantendo o dia da 1ª. */
export function gerarParcelas(
  totalCents: Cents,
  quantidade: number,
  primeiraData: IsoDate,
): Parcela[] {
  const dia = Number(primeiraData.slice(8, 10));
  const base = competenciaDe(primeiraData);
  return splitInstallments(totalCents, quantidade).map((valorCents, i) => ({
    numero: i + 1,
    valorCents,
    data: dataNoMes(addMeses(base, i), dia),
  }));
}
