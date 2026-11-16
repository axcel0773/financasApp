import { addMeses, dataNoMes, type Competencia, type IsoDate } from '../shared/competencia';
import { enesimoDiaUtil, ultimoDiaUtil } from '../shared/dias-uteis';
import type { Cents } from '../shared/money';
import { dividirSalario, type Holerite } from './holerite';

/**
 * Quando cai o pagamento final: num dia fixo do mês seguinte à referência (`finalDay`), no 5º dia útil
 * do mês seguinte, ou no último dia útil do próprio mês de referência.
 */
export type RegraPagamentoFinal = 'dia' | 'quinto_dia_util' | 'ultimo_dia_util';
export const REGRAS_PAGAMENTO_FINAL: readonly RegraPagamentoFinal[] = ['dia', 'quinto_dia_util', 'ultimo_dia_util'];

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
  finalRule: RegraPagamentoFinal;
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
 * (o app aceita lançamento manual). A data do pagamento final segue `finalRule`.
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
  const dataFinal = dataDoPagamentoFinal(fonte, competencia);
  if (dataFinal)
    out.push({
      ...base,
      kind: 'final',
      expectedOn: dataFinal,
      expectedNetCents: finalCents,
    });
  return out;
}

/** Data prevista do pagamento final de uma referência; null quando a regra é "dia" e o dia não foi informado. */
export function dataDoPagamentoFinal(
  fonte: Pick<FonteRenda, 'finalDay' | 'finalRule'>,
  competencia: Competencia,
): IsoDate | null {
  if (fonte.finalRule === 'ultimo_dia_util') return ultimoDiaUtil(competencia);
  if (fonte.finalRule === 'quinto_dia_util') return enesimoDiaUtil(addMeses(competencia, 1), 5);
  return fonte.finalDay ? dataNoMes(addMeses(competencia, 1), fonte.finalDay) : null;
}

/** Tem alguma data cadastrada (adiantamento ou final), ou seja, o app consegue gerar previstos. */
export const temDatas = (f: Pick<FonteRenda, 'advanceDay' | 'finalDay' | 'finalRule'>): boolean =>
  !!f.advanceDay || !!f.finalDay || f.finalRule !== 'dia';

export const totalRecebido = (rs: Recebimento[]): Cents =>
  rs.reduce((s, r) => s + (r.netCents ?? 0), 0);
export const totalPrevistoPendente = (rs: Recebimento[]): Cents =>
  rs.filter((r) => r.receivedOn === null).reduce((s, r) => s + (r.expectedNetCents ?? 0), 0);
export const diferencaPrevistoRecebido = (r: Recebimento): Cents | null =>
  r.netCents === null || r.expectedNetCents === null ? null : r.netCents - r.expectedNetCents;

/** Próximo recebimento previsto e ainda não recebido, de hoje em diante; null se não houver. */
export function proximoRecebimento(recebimentos: Recebimento[], hoje: IsoDate): Recebimento | null {
  return (
    recebimentos
      .filter((r) => r.receivedOn === null && r.expectedOn !== null && r.expectedOn >= hoje)
      .sort((a, b) => (a.expectedOn! < b.expectedOn! ? -1 : a.expectedOn! > b.expectedOn! ? 1 : 0))[0] ?? null
  );
}
