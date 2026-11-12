import 'server-only';
import { revalidatePath } from 'next/cache';
import type { DomainError } from '@/core/shared/errors';
import type { Result } from '@/core/shared/result';
import { createSupabaseServer } from '@/infra/supabase/client.server';
import { RepositoryError } from '@/infra/supabase/repositories/shared';
import type { ActionState } from './action-state';

export async function exigirUsuario(): Promise<{ id: string; email: string }> {
  const db = await createSupabaseServer();
  const { data } = await db.auth.getUser(); // valida o token no servidor
  if (!data.user) throw new Error('Não autenticado.');
  return { id: data.user.id, email: data.user.email ?? '' };
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
    console.error('action_error', e instanceof RepositoryError ? e.code : 'unexpected');
    return { ok: false, message: 'Não foi possível concluir. Tente novamente.' };
  }
}
