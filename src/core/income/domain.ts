import { addMeses, dataNoMes, type Competencia, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';
import { dividirSalario, type Holerite } from './holerite';

export type TipoRecebimento =
  'advance' | 'final' | 'thirteenth_1' | 'thirteenth_2' | 'vacation' | 'plr' | 'extra';
export interface FonteRenda {
  id: string;
  kind: 'salary' | 'thirteenth' | 'plr' | 'extra';
  name: string;
  employer: string | null;
  grossCents: Cents;
  advancePercent: number | null;
  advanceDay: number | null;
  finalDay: number | null;
  walletId: string | null;
  active: boolean;
  dependents: number;
  alimonyCents: Cents;
}
export interface Recebimento {
  id: string;
  sourceId: string;
  kind: TipoRecebimento;
  competencia: Competencia;
  expectedOn: IsoDate | null;
  expectedNetCents: Cents | null;
  receivedOn: IsoDate | null;
  grossCents: Cents | null;
  deductionsCents: Cents;
  netCents: Cents | null;
  walletId: string | null;
  note: string | null;
}
export type NovoPrevisto = Pick<
  Recebimento,
  'sourceId' | 'kind' | 'competencia' | 'expectedOn' | 'expectedNetCents' | 'walletId'
>;

/**
 * Previstos de um mês de referência. Datas são OPCIONAIS: sem advance_day/final_day não gera previsto
 * (o app aceita lançamento manual). O pagamento final cai no mês seguinte ao da referência.
 */
export function gerarPrevistos(
  fonte: FonteRenda,
  competencia: Competencia,
  holerite: Holerite,
): NovoPrevisto[] {
  if (!fonte.active || fonte.kind !== 'salary') return [];
  const pct = fonte.advancePercent ?? 0;
  const { adiantamentoCents, finalCents } = dividirSalario(holerite, pct);
  const base = { sourceId: fonte.id, competencia, walletId: fonte.walletId };
  const out: NovoPrevisto[] = [];
  if (fonte.advanceDay && pct > 0)
    out.push({
      ...base,
      kind: 'advance',
      expectedOn: dataNoMes(competencia, fonte.advanceDay),
      expectedNetCents: adiantamentoCents,
    });
  if (fonte.finalDay)
    out.push({
      ...base,
      kind: 'final',
      expectedOn: dataNoMes(addMeses(competencia, 1), fonte.finalDay),
      expectedNetCents: finalCents,
    });
  return out;
}

export const totalRecebido = (rs: Recebimento[]): Cents =>
  rs.reduce((s, r) => s + (r.netCents ?? 0), 0);
export const totalPrevistoPendente = (rs: Recebimento[]): Cents =>
  rs.filter((r) => r.receivedOn === null).reduce((s, r) => s + (r.expectedNetCents ?? 0), 0);
export const diferencaPrevistoRecebido = (r: Recebimento): Cents | null =>
  r.netCents === null || r.expectedNetCents === null ? null : r.netCents - r.expectedNetCents;
