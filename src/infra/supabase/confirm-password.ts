import { createClient } from '@supabase/supabase-js';
import { env } from '@/infra/env';

/** Reautentica sem tocar nos cookies da sessão: usado antes de ações destrutivas e da exportação. */
export async function senhaConfere(email: string, senha: string): Promise<boolean> {
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password: senha });
  return !error;
}
