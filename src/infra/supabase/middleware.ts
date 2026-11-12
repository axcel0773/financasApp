import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { aalDoToken, exigeCodigo } from '@/core/auth/mfa';
import { env } from '@/infra/env';

const PUBLIC_PATHS = ['/login'];

/** Renova a sessão e redireciona quem não está logado para /login. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getUser() valida o token no servidor do Supabase (getSession() não valida).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isVerificar = path.startsWith('/login/verificar');
  const ir = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = '';
    return NextResponse.redirect(url);
  };

  if (!user) return isPublic ? response : ir('/login');

  // Segunda etapa: com autenticador verificado, a sessão só vale depois do código (aal2).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (exigeCodigo(user.factors, aalDoToken(session?.access_token))) {
    return isVerificar ? response : ir('/login/verificar');
  }
  if (isPublic) return ir('/');
  return response;
}
