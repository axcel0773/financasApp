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

  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await enderecoDoApp()}/auth/callback` });
  return { error: null, enviado: true };
}

/**
 * Endereço do app para o link do e-mail. Em produção é fixo (APP_URL, ou o domínio de produção que a
 * Vercel informa), nunca o Host da requisição, que quem pede pode forjar. Só em desenvolvimento usa o Host.
 */
async function enderecoDoApp(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  return `${host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'}://${host}`;
}
