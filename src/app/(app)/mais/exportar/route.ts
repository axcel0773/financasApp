import { NextResponse } from 'next/server';
import { getContainer } from '@/composition/container';
import { senhaConfere } from '@/infra/supabase/confirm-password';
import { createSupabaseServer } from '@/infra/supabase/client.server';

/** Exportação CSV dos lançamentos. Exige a senha (POST), nunca vai para cache e neutraliza fórmulas de planilha. */
const NEUTRO = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const csv = (v: string | number | null) => {
  const s = NEUTRO(String(v ?? ''));
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function POST(req: Request) {
  const db = await createSupabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user?.email) return new NextResponse('Não autorizado', { status: 401 });
  const fd = await req.formData();
  const senha = fd.get('senha');
  if (typeof senha !== 'string' || !(await senhaConfere(user.email, senha)))
    return new NextResponse('Senha incorreta', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  const c = await getContainer();
  const [wallets, cats] = await Promise.all([c.wallets.list(), c.categories.list()]);
  const carteira = new Map(wallets.map((w) => [w.id, w.name]));
  const categoria = new Map(cats.map((x) => [x.id, x.name]));
  const enc = new TextEncoder();
  const PAGINA = 1000;
  let cursor: { occurredOn: string; id: string } | undefined;

  // Transmite em páginas (cursor): a memória não cresce com o número de lançamentos.
  const corpo = new ReadableStream<Uint8Array>({
    async start(ctl) {
      ctl.enqueue(enc.encode('\uFEFF' + ['data', 'tipo', 'valor', 'carteira', 'categoria', 'descricao'].join(';') + '\r\n'));
    },
    async pull(ctl) {
      try {
        const pag = await c.transactions.list({ limite: PAGINA, cursor });
        if (pag.length === 0) return ctl.close();
        ctl.enqueue(
          enc.encode(
            pag
              .map((t) =>
                [
                  t.occurredOn,
                  t.kind,
                  (t.amountCents / 100).toFixed(2).replace('.', ','),
                  carteira.get(t.walletId) ?? '',
                  (t.categoryId && categoria.get(t.categoryId)) || '',
                  t.note ?? '',
                ]
                  .map(csv)
                  .join(';') + '\r\n',
              )
              .join(''),
          ),
        );
        const ult = pag[pag.length - 1]!;
        cursor = { occurredOn: ult.occurredOn, id: ult.id };
        if (pag.length < PAGINA) ctl.close();
      } catch (e) {
        console.error('export_error', e instanceof Error ? e.name : 'unexpected');
        ctl.error(e);
      }
    },
  });
  return new NextResponse(corpo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lancamentos.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
