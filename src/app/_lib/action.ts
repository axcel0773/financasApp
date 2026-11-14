import 'server-only';
import { revalidatePath } from 'next/cache';
import type { DomainError } from '@/core/shared/errors';
import type { Result } from '@/core/shared/result';
import { createSupabaseServer } from '@/infra/supabase/client.server';
import { RepositoryError } from '@/infra/supabase/repositories/shared';
import type { ActionState } from './action-state';

export async function exigirUsuario(): Promise<{ id: string; email: string }> {
  const db = await createSupabaseServer();
  const { data } = await db.auth.getClaims(); // confere a assinatura do token localmente
  const c = data?.claims;
  if (!c?.sub) throw new Error('Não autenticado.');
  return { id: c.sub, email: typeof c.email === 'string' ? c.email : '' };
}

/**
 * Envelope das Server Actions: Server Actions ficam finas (validar → caso de uso → devolver estado).
 * Erros inesperados viram mensagem genérica; só o código vai ao log (nunca valores nem e-mail).
 */
export async function executar(
  corpo: () => Promise<Result<unknown, DomainError | string> | void>,
  sucesso = 'Salvo.',
): Promise<ActionState> {
  try {
    await exigirUsuario();
    const r = await corpo();
    if (r && !r.ok)
      return { ok: false, message: typeof r.error === 'string' ? r.error : r.error.message };
    revalidatePath('/', 'layout');
    return { ok: true, message: sucesso };
  } catch (e) {
    // Sem monitoramento externo, este log é a única pista: nome e mensagem do erro (nunca valores nem e-mail).
    const pista =
      e instanceof RepositoryError ? e.code : e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : 'unexpected';
    console.error('action_error', pista);
    return { ok: false, message: 'Não foi possível concluir. Tente novamente.' };
  }
}
