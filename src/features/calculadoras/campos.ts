import { formatarCentavos, parseBRL } from '@/core/shared/money';

/** Texto do campo de dinheiro → centavos (vazio ou inválido = 0). */
export const cents = (s: string): number => {
  const r = parseBRL(s || '0');
  return r.ok ? r.value : 0;
};
/** Centavos → texto do campo ("1.234,56"); zero vira vazio. */
export const campo = (c: number): string => (c > 0 ? formatarCentavos(String(Math.round(c))) : '');
/** Número digitado com vírgula ou ponto; inválido = padrão. */
export const num = (s: string, padrao = 0): number => {
  const n = Number(s.trim().replace(/\./g, '').replace(',', '.'));
  return s.trim() !== '' && Number.isFinite(n) ? n : padrao;
};
/** Percentual para o campo ("1,5"). */
export const pct = (n: number): string => (n ? String(n).replace('.', ',') : '');
/** Número curto em pt-BR com até 1 casa ("2,5"). */
export const br1 = (n: number): string => n.toFixed(1).replace('.', ',').replace(/,0$/, '');
