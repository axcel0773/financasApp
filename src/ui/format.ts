import type { Competencia, IsoDate } from '@/core/shared/competencia';
import { isCompetencia } from '@/core/shared/competencia';

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
export const rotuloCompetencia = (c: Competencia): string =>
  `${MESES[Number(c.slice(5, 7)) - 1] ?? ''} de ${c.slice(0, 4)}`;
export const rotuloMesCurto = (c: Competencia): string =>
  (MESES[Number(c.slice(5, 7)) - 1] ?? '').slice(0, 3);
export const dataCurta = (d: IsoDate): string =>
  `${Number(d.slice(8, 10))} ${rotuloMesCurto(d.slice(0, 7))}`;
export const dataLonga = (d: IsoDate): string =>
  `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
export const competenciaDoParam = (
  v: string | string[] | undefined,
  padrao: Competencia,
): Competencia => (typeof v === 'string' && isCompetencia(v) ? v : padrao);
/** Centavos para o texto de um campo monetário ("1234,56"), para preencher formulários. */
export const centavosParaCampo = (c: number): string => (c / 100).toFixed(2).replace('.', ',');
