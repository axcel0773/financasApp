import { z } from 'zod';
import { isIsoDate } from '@/core/shared/competencia';
import { parseBRL } from '@/core/shared/money';
import { err, ok, type Result } from '@/core/shared/result';

export const dinheiro = z
  .string()
  .trim()
  .min(1, 'Informe o valor.')
  .transform((s, ctx) => {
    const r = parseBRL(s);
    if (!r.ok) {
      ctx.addIssue({ code: 'custom', message: 'Valor inválido. Use o formato 1.234,56.' });
      return z.NEVER;
    }
    return r.value;
  });
export const dinheiroPositivo = dinheiro.refine((v) => v > 0, 'O valor deve ser maior que zero.');
export const dinheiroOpcional = z
  .string()
  .trim()
  .transform((s, ctx) => {
    if (s === '') return null;
    const r = parseBRL(s);
    if (!r.ok) {
      ctx.addIssue({ code: 'custom', message: 'Valor inválido. Use o formato 1.234,56.' });
      return z.NEVER;
    }
    return r.value;
  });
export const data = z.string().refine(isIsoDate, 'Data inválida.');
export const dataOpcional = z
  .string()
  .transform((s) => (s === '' ? null : s))
  .refine((s) => s === null || isIsoDate(s), 'Data inválida.');
export const uuid = z.string().uuid('Seleção inválida.');
export const uuidOpcional = z
  .string()
  .transform((s) => (s === '' ? null : s))
  .pipe(z.string().uuid('Seleção inválida.').nullable());
export const inteiroOpcional = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((s, ctx) => {
      if (s === '') return null;
      const n = Number(s);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: 'custom', message: `Informe um número entre ${min} e ${max}.` });
        return z.NEVER;
      }
      return n;
    });
export const inteiro = (min: number, max: number) =>
  z.coerce
    .number({ error: 'Número inválido.' })
    .int('Número inválido.')
    .min(min, `Mínimo ${min}.`)
    .max(max, `Máximo ${max}.`);
export const competencia = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido.');
export const texto = (max: number, min = 1) =>
  z.string().trim().min(min, 'Campo obrigatório.').max(max, `Máximo de ${max} caracteres.`);
export const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .transform((s) => (s === '' ? null : s));

export function lerForm<T extends z.ZodTypeAny>(
  schema: T,
  fonte: FormData | Record<string, unknown>,
): Result<z.infer<T>, string> {
  const obj = fonte instanceof FormData ? Object.fromEntries(fonte) : fonte;
  const r = schema.safeParse(obj);
  return r.success ? ok(r.data) : err(r.error.issues[0]?.message ?? 'Dados inválidos.');
}
