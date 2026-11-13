'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServer } from '@/infra/supabase/client.server';

export type RedefinirState = { error: string | null };

const schema = z
  .object({ senha: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.').max(128), confirma: z.string() })
  .refine((v) => v.senha === v.confirma, { message: 'As senhas não são iguais.', path: ['confirma'] });

export async function salvarNovaSenha(_prev: RedefinirState, form: FormData): Promise<RedefinirState> {
  const parsed = schema.safeParse({ senha: form.get('senha'), confirma: form.get('confirma') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return { error: 'Não foi possível salvar a senha. Peça um novo link em "Esqueci a senha".' };
  await supabase.auth.signOut({ scope: 'others' }); // encerra os outros aparelhos
  redirect('/');
}
