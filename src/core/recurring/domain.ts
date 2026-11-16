import { dataNoMes, type Competencia, type IsoDate } from '../shared/competencia';
import { splitInstallments, type Cents } from '../shared/money';

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

/**
 * Próximo fixo ativo a cair, a partir de hoje: o de dia mais próximo neste mês; se todos já passaram, o primeiro do mês seguinte.
 * Dias maiores que o mês (ex.: 31 em novembro) caem no último dia, como na geração dos lançamentos.
 */
export function proximoFixo(regras: RegraFixa[], hoje: IsoDate): { regra: RegraFixa; date: IsoDate } | null {
  const ativos = regras.filter((r) => r.active);
  if (ativos.length === 0) return null;
  const [a, m, d] = hoje.split('-').map(Number) as [number, number, number];
  const naData = (ano: number, mes: number, dia: number) => {
    const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
  };
  const candidatos = ativos.map((r) => {
    const nesteMes = naData(a, m, r.dayOfMonth);
    const date = Number(nesteMes.slice(8)) >= d ? nesteMes : naData(m === 12 ? a + 1 : a, m === 12 ? 1 : m + 1, r.dayOfMonth);
    return { regra: r, date };
  });
  return candidatos.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0))[0]!;
}

/** Quanto falta pagar de um parcelamento, com as parcelas exatas (o resto dos centavos vai na 1ª). */
export function restanteDoParcelamento(totalCents: Cents, parcelas: number, pagas: number): Cents {
  const valores = splitInstallments(totalCents, parcelas);
  return valores.slice(Math.min(Math.max(0, pagas), parcelas)).reduce((s, v) => s + v, 0);
}
