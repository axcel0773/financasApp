import { NextResponse, type NextRequest } from 'next/server';

/** Recebe relatórios de violação da CSP e registra só o essencial (sem URLs completas nem dados do usuário). */
export async function POST(request: NextRequest) {
  const texto = await request.text();
  if (texto.length > 10_000) return new NextResponse(null, { status: 413 });
  try {
    const bruto = JSON.parse(texto) as Record<string, unknown>;
    const r = (bruto['csp-report'] ?? bruto) as Record<string, unknown>;
    console.warn(
      'csp_violation',
      JSON.stringify({
        diretiva: r['effective-directive'] ?? r['violated-directive'],
        bloqueado: String(r['blocked-uri'] ?? '').slice(0, 80),
        pagina: String(r['document-uri'] ?? '').replace(/[?#].*$/, '').slice(0, 120),
      }),
    );
  } catch {
    /* relatório mal formado: ignora */
  }
  return new NextResponse(null, { status: 204 });
}
