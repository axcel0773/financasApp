'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { temSegundaEtapa } from '@/core/auth/mfa';
import { createSupabaseServer } from '@/infra/supabase/client.server';

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: 'Informe um e-mail válido e a senha (mín. 8 caracteres).' };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Mensagem genérica: não revela se o e-mail existe.
  if (error) return { error: 'E-mail ou senha incorretos.' };

  redirect(temSegundaEtapa(data.user?.factors) ? '/login/verificar' : '/');
}

const codigoSchema = z.string().trim().regex(/^\d{6}$/);

/** Segunda etapa: confere o código de 6 dígitos em cada autenticador verificado até um aceitar. */
export async function verificarCodigo(_prev: LoginState, form: FormData): Promise<LoginState> {
  const codigo = codigoSchema.safeParse(form.get('codigo'));
  if (!codigo.success) return { error: 'Digite os 6 dígitos do aplicativo autenticador.' };

  const supabase = await createSupabaseServer();
  const { data: fatores, error } = await supabase.auth.mfa.listFactors();
  if (error) return { error: 'Não foi possível validar agora. Tente de novo.' };
  for (const f of fatores.totp) {
    const r = await supabase.auth.mfa.challengeAndVerify({ factorId: f.id, code: codigo.data });
    if (!r.error) redirect('/');
  }
  return { error: 'Código incorreto ou expirado.' };
}

export async function logout() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
