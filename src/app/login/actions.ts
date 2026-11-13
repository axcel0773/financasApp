'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServer } from '@/infra/supabase/client.server';
import {
  REGRA_LOGIN_EMAIL,
  REGRA_LOGIN_IP,
  chave,
  ipDoPedido,
  limpar,
  mensagemBloqueio,
  registrarFalha,
  segundosBloqueado,
} from '@/infra/security/throttle';

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: 'Informe um e-mail válido e a senha (mín. 8 caracteres).' };

  const supabase = await createSupabaseServer();
  const ip = await ipDoPedido();
  const kEmail = chave('login-email', ip, parsed.data.email.toLowerCase());
  const kIp = chave('login-ip', ip);

  const bloqueado = await segundosBloqueado(supabase, [kEmail, kIp]);
  if (bloqueado > 0) return { error: mensagemBloqueio(bloqueado) };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    await Promise.all([registrarFalha(supabase, kEmail, REGRA_LOGIN_EMAIL), registrarFalha(supabase, kIp, REGRA_LOGIN_IP)]);
    // Mensagem genérica: não revela se o e-mail existe.
    return { error: 'E-mail ou senha incorretos.' };
  }
  await limpar(supabase, kEmail);
  redirect('/');
}

export async function logout() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
