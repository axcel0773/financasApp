import { diffDias, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface Meta {
  id: string;
  kind: 'emergency' | 'other';
  name: string;
  targetCents: Cents;
  currentCents: Cents;
  deadline: IsoDate | null;
  plannedMonthlyCents: Cents | null;
}

/** Cobertura da reserva em meses = reserva ÷ média mensal de gastos. */
export function coberturaEmMeses(reservaCents: Cents, mediaGastoMensalCents: Cents): number {
  return mediaGastoMensalCents > 0 ? reservaCents / mediaGastoMensalCents : 0;
}
export const mediaGastoMensal = (gastosPorMesCents: Cents[]): Cents =>
  gastosPorMesCents.length
    ? Math.round(gastosPorMesCents.reduce((s, g) => s + g, 0) / gastosPorMesCents.length)
    : 0;

export const progressoPct = (m: Pick<Meta, 'currentCents' | 'targetCents'>): number =>
  Math.min(100, Math.round((m.currentCents / m.targetCents) * 100));

/** Meses restantes no ritmo do aporte planejado; null sem aporte. */
export function mesesParaAtingir(
  m: Pick<Meta, 'currentCents' | 'targetCents' | 'plannedMonthlyCents'>,
): number | null {
  const falta = Math.max(0, m.targetCents - m.currentCents);
  if (falta === 0) return 0;
  return m.plannedMonthlyCents && m.plannedMonthlyCents > 0
    ? Math.ceil(falta / m.plannedMonthlyCents)
    : null;
}
/** Aporte mensal necessário para chegar ao alvo até o prazo. */
export function aporteNecessario(
  m: Pick<Meta, 'currentCents' | 'targetCents' | 'deadline'>,
  hoje: IsoDate,
): Cents | null {
  if (!m.deadline) return null;
  const meses = Math.max(1, Math.ceil(diffDias(hoje, m.deadline) / 30.4375));
  return Math.max(0, Math.ceil((m.targetCents - m.currentCents) / meses));
}
