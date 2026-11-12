/** Datas e competências como strings ISO, sempre em UTC: sem surpresas de fuso. */
export type IsoDate = string; // 'YYYY-MM-DD'
export type Competencia = string; // 'YYYY-MM'

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const COMP = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isIsoDate(s: string): boolean {
  const m = ISO.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}
export function isCompetencia(s: string): boolean {
  return COMP.test(s);
}
export const competenciaDe = (d: IsoDate): Competencia => d.slice(0, 7);

function partes(c: Competencia): [number, number] {
  const m = COMP.exec(c);
  if (!m) throw new RangeError(`competência inválida: ${c}`);
  return [Number(m[1]), Number(m[2])];
}
const fmt = (y: number, m: number): Competencia =>
  `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`;

export function addMeses(c: Competencia, n: number): Competencia {
  const [y, m] = partes(c);
  const idx = y * 12 + (m - 1) + n;
  return fmt(Math.floor(idx / 12), (((idx % 12) + 12) % 12) + 1);
}
export function diasNoMes(c: Competencia): number {
  const [y, m] = partes(c);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
/** Dia do mês limitado ao último dia (dia 31 em fevereiro vira 28/29). */
export function dataNoMes(c: Competencia, dia: number): IsoDate {
  const d = Math.min(Math.max(1, dia), diasNoMes(c));
  return `${c}-${String(d).padStart(2, '0')}`;
}
export const primeiroDia = (c: Competencia): IsoDate => `${c}-01`;
export const ultimoDia = (c: Competencia): IsoDate => dataNoMes(c, 31);

const toUtc = (d: IsoDate): number => {
  if (!isIsoDate(d)) throw new RangeError(`data inválida: ${d}`);
  return Date.parse(`${d}T00:00:00Z`);
};
export function addDias(d: IsoDate, n: number): IsoDate {
  return new Date(toUtc(d) + n * 86_400_000).toISOString().slice(0, 10);
}
/** Dias de a até b (b - a). */
export function diffDias(a: IsoDate, b: IsoDate): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}
