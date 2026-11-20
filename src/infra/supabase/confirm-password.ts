import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/infra/env';
import { chave, limpar, mensagemBloqueio, registrarFalha, segundosBloqueado, type Regra } from '@/infra/security/throttle';

/** Confirmar a senha (exportar, apagar de vez): 5 erros em 15 minutos bloqueiam por 15 minutos. */
export const REGRA_CONFIRMAR_SENHA: Regra = { max: 5, janelaS: 900, bloqueioS: 900 };

export type ConfirmacaoSenha = { ok: true } | { ok: false; mensagem: string };

/**
 * Reautentica sem tocar nos cookies da sessão: usado antes de ações destrutivas e da exportação.
 * Com limite de tentativas por conta, para quem tiver uma sessão aberta não conseguir descobrir a senha.
 */
export async function confirmarSenha(email: string, senha: string): Promise<ConfirmacaoSenha> {
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const k = chave('confirmar-senha', email.toLowerCase());
  const bloqueado = await segundosBloqueado(c, [k]);
  if (bloqueado > 0) return { ok: false, mensagem: mensagemBloqueio(bloqueado) };
  const { error } = await c.auth.signInWithPassword({ email, password: senha });
  if (error) {
    await registrarFalha(c, k, REGRA_CONFIRMAR_SENHA);
    return { ok: false, mensagem: 'Senha incorreta.' };
  }
  await limpar(c, k);
  return { ok: true };
}
