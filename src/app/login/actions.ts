'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Mensagem genérica: não revela se o e-mail existe.
  if (error) return { error: 'E-mail ou senha incorretos.' };

  redirect('/');
}

export async function logout() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
