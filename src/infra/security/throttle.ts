import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Regra {
  max: number;
  janelaS: number;
  bloqueioS: number;
}

/** Login: 5 erros do mesmo e-mail e 20 do mesmo IP em 15 minutos bloqueiam por 15 minutos. */
export const REGRA_LOGIN_EMAIL: Regra = { max: 5, janelaS: 900, bloqueioS: 900 };
export const REGRA_LOGIN_IP: Regra = { max: 20, janelaS: 900, bloqueioS: 900 };
/** "Esqueci a senha": 5 pedidos por IP por hora. */
export const REGRA_RESET_IP: Regra = { max: 5, janelaS: 3600, bloqueioS: 3600 };

/** Chave opaca: HMAC com segredo do servidor (quem chama a API direto não consegue calculá-la). */
export function chave(tipo: string, ...partes: string[]): string {
  const segredo = process.env.AUTH_THROTTLE_SECRET ?? 'dev-somente-local';
  return createHmac('sha256', segredo).update([tipo, ...partes].join('|')).digest('hex').slice(0, 40);
}

export async function ipDoPedido(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'desconhecido').trim();
}

/** Maior bloqueio (em segundos) entre as chaves. Se o banco falhar, não bloqueia (disponibilidade). */
export async function segundosBloqueado(db: SupabaseClient, chaves: string[]): Promise<number> {
  const r = await Promise.all(chaves.map((k) => db.rpc('auth_throttle_check', { p_key: k })));
  return Math.max(0, ...r.map((x) => (typeof x.data === 'number' ? x.data : 0)));
}

export async function registrarFalha(db: SupabaseClient, k: string, regra: Regra): Promise<void> {
  await db.rpc('auth_throttle_fail', {
    p_key: k,
    p_max: regra.max,
    p_window_s: regra.janelaS,
    p_block_s: regra.bloqueioS,
  });
}

export async function limpar(db: SupabaseClient, k: string): Promise<void> {
  await db.rpc('auth_throttle_clear', { p_key: k });
}

export function mensagemBloqueio(segundos: number): string {
  const min = Math.max(1, Math.ceil(segundos / 60));
  return `Muitas tentativas. Tente de novo em ${min} ${min === 1 ? 'minuto' : 'minutos'}.`;
}
