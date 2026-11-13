'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServer } from '@/infra/supabase/client.server';
import {
  REGRA_RESET_IP,
  chave,
  ipDoPedido,
  mensagemBloqueio,
  registrarFalha,
  segundosBloqueado,
} from '@/infra/security/throttle';

export type EsqueciState = { error: string | null; enviado: boolean };

const email = z.string().trim().email().max(254);

/** Responde sempre igual, exista ou não o e-mail (não revela quem tem conta). */
export async function pedirRedefinicao(_prev: EsqueciState, form: FormData): Promise<EsqueciState> {
  const parsed = email.safeParse(form.get('email'));
  if (!parsed.success) return { error: 'Informe um e-mail válido.', enviado: false };

  const supabase = await createSupabaseServer();
  const k = chave('reset-ip', await ipDoPedido());
  const bloqueado = await segundosBloqueado(supabase, [k]);
  if (bloqueado > 0) return { error: mensagemBloqueio(bloqueado), enviado: false };
  await registrarFalha(supabase, k, REGRA_RESET_IP); // cada pedido conta; ao 5º na hora, bloqueia

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') || host?.startsWith('127.') ? 'http' : 'https');
  // O Supabase só aceita endereços da lista de URLs permitidas; fora dela, usa o Site URL.
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${proto}://${host}/auth/callback` });
  return { error: null, enviado: true };
}
