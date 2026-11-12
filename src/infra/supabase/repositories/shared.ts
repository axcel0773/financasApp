import type { PostgrestError } from '@supabase/supabase-js';

export class RepositoryError extends Error {
  constructor(
    public readonly code: string,
    operation: string,
  ) {
    // Nunca inclui valores financeiros nem e-mail na mensagem.
    super(`Falha ao ${operation} (${code})`);
  }
}
export const UNIQUE_VIOLATION = '23505';
export function check(error: PostgrestError | null, operation: string): void {
  if (error) throw new RepositoryError(error.code, operation);
}
export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v));
export const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);
