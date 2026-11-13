import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServer } from '@/infra/supabase/client.server';

/** Destino do link do e-mail de redefinição: troca o código por uma sessão e abre a tela da nova senha. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type') as EmailOtpType | null;
  const supabase = await createSupabaseServer();

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && tipo === 'recovery')
    ok = !(await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })).error;

  return NextResponse.redirect(`${origin}${ok ? '/redefinir' : '/login?erro=link'}`);
}
