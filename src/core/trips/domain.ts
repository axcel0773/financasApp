import { diffDias, isIsoDate, type IsoDate } from '../shared/competencia';
import { domainError, type DomainError } from '../shared/errors';
import type { Cents } from '../shared/money';
import { err, ok, type Result } from '../shared/result';

export interface Viagem {
  id: string;
  name: string;
  startOn: IsoDate;
  /** Nulo = volta ainda não definida (viagem em aberto). */
  endOn: IsoDate | null;
  budgetCents: Cents;
  people: number;
}
export type NovaViagem = Omit<Viagem, 'id'>;
export type EstadoViagem = 'planejada' | 'andamento' | 'concluida';

export function validarViagem(v: NovaViagem): Result<NovaViagem, DomainError> {
  const name = v.name.trim();
  if (name.length < 1 || name.length > 80) return err(domainError('nome_invalido', 'Informe o nome da viagem (até 80 caracteres).'));
  if (!isIsoDate(v.startOn) || (v.endOn !== null && !isIsoDate(v.endOn))) return err(domainError('data_invalida', 'Data inválida.'));
  if (v.endOn !== null && v.endOn < v.startOn) return err(domainError('periodo_invalido', 'A volta não pode ser antes da ida.'));
  if (!Number.isSafeInteger(v.budgetCents) || v.budgetCents < 0) return err(domainError('valor_invalido', 'Orçamento inválido.'));
  if (!Number.isInteger(v.people) || v.people < 1 || v.people > 20) return err(domainError('pessoas_invalido', 'Informe de 1 a 20 pessoas.'));
  return ok({ ...v, name });
}

export const estadoViagem = (v: Pick<Viagem, 'startOn' | 'endOn'>, hoje: IsoDate): EstadoViagem =>
  hoje < v.startOn ? 'planejada' : v.endOn !== null && hoje > v.endOn ? 'concluida' : 'andamento';

export interface ResumoViagem {
  totalCents: Cents;
  /** Percentual do orçamento usado (null sem orçamento). */
  usadoPct: number | null;
  restanteCents: Cents | null;
  /** Nulo com a volta em aberto. */
  diasTotal: number | null;
  /** Dia atual da viagem (0 se ainda não começou; diasTotal se já acabou). */
  diaAtual: number;
  /** Nulo com a volta em aberto. */
  diasRestantes: number | null;
  mediaPorDiaCents: Cents;
  /** Quanto pode gastar por dia nos dias restantes para fechar no orçamento (null se não aplicável). */
  podeGastarPorDiaCents: Cents | null;
  porPessoaCents: Cents;
  porCategoria: { categoryId: string | null; cents: Cents; pct: number }[];
  estourou: boolean;
}

export function resumirViagem(
  v: Viagem,
  gastos: { categoryId: string | null; cents: Cents }[],
  hoje: IsoDate,
): ResumoViagem {
  const totalCents = gastos.reduce((s, g) => s + g.cents, 0);
  const diasTotal = v.endOn === null ? null : diffDias(v.startOn, v.endOn) + 1;
  const decorridos = hoje < v.startOn ? 0 : diffDias(v.startOn, hoje) + 1;
  const diaAtual = diasTotal === null ? decorridos : Math.min(diasTotal, decorridos);
  const diasRestantes = diasTotal === null ? null : Math.max(0, diasTotal - diaAtual);
  const mapa = new Map<string | null, Cents>();
  for (const g of gastos) mapa.set(g.categoryId, (mapa.get(g.categoryId) ?? 0) + g.cents);
  const restanteCents = v.budgetCents > 0 ? v.budgetCents - totalCents : null;
  return {
    totalCents,
    usadoPct: v.budgetCents > 0 ? Math.round((totalCents / v.budgetCents) * 100) : null,
    restanteCents,
    diasTotal,
    diaAtual,
    diasRestantes,
    mediaPorDiaCents: diaAtual > 0 ? Math.round(totalCents / diaAtual) : 0,
    podeGastarPorDiaCents:
      restanteCents !== null && diasRestantes !== null && diasRestantes > 0 && restanteCents > 0 ? Math.round(restanteCents / diasRestantes) : null,
    porPessoaCents: Math.round(totalCents / v.people),
    porCategoria: [...mapa.entries()]
      .map(([categoryId, cents]) => ({ categoryId, cents, pct: totalCents > 0 ? (cents / totalCents) * 100 : 0 }))
      .sort((a, b) => b.cents - a.cents),
    estourou: restanteCents !== null && restanteCents < 0,
  };
}
