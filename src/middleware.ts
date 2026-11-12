import type { NextRequest } from 'next/server';
import { updateSession } from '@/infra/supabase/middleware';

/** CSP com nonce por requisição: scripts inline só rodam com o nonce que o Next injeta. */
function politica(nonce: string): string {
  const dev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = politica(nonce);
  request.headers.set('x-nonce', nonce);
  request.headers.set('Content-Security-Policy', csp);
  const response = await updateSession(request);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)',
  ],
};
