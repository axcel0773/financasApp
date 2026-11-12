import { dataNoMes, type Competencia, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface RegraFixa {
  id: string;
  name: string;
  dayOfMonth: number;
  amountCents: Cents;
  categoryId: string | null;
  walletId: string;
  active: boolean;
  startOn: IsoDate;
}
export interface OcorrenciaFixa {
  ruleId: string;
  date: IsoDate;
  amountCents: Cents;
  name: string;
  walletId: string;
  categoryId: string | null;
}

/** Chave de idempotência: (regra, data). Espelha o índice único do banco. */
export const chaveOcorrencia = (ruleId: string, date: IsoDate): string => `${ruleId}|${date}`;

/** Ocorrências ainda não geradas de uma competência. Rodar duas vezes não duplica nada. */
export function ocorrenciasPendentes(
  regras: RegraFixa[],
  competencia: Competencia,
  jaGeradas: Set<string>,
): OcorrenciaFixa[] {
  return regras
    .filter((r) => r.active)
    .map((r) => ({ r, date: dataNoMes(competencia, r.dayOfMonth) }))
    .filter(({ r, date }) => date >= r.startOn && !jaGeradas.has(chaveOcorrencia(r.id, date)))
    .map(({ r, date }) => ({
      ruleId: r.id,
      date,
      amountCents: r.amountCents,
      name: r.name,
      walletId: r.walletId,
      categoryId: r.categoryId,
    }));
}
