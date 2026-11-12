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
  const [txs, wallets, cats] = await Promise.all([
    c.transactions.list({ limite: 50000 }),
    c.wallets.list(),
    c.categories.list(),
  ]);
  const linhas = [['data', 'tipo', 'valor', 'carteira', 'categoria', 'descricao'].join(';')];
  for (const t of txs)
    linhas.push(
      [
        t.occurredOn,
        t.kind,
        (t.amountCents / 100).toFixed(2).replace('.', ','),
        wallets.find((w) => w.id === t.walletId)?.name ?? '',
        cats.find((x) => x.id === t.categoryId)?.name ?? '',
        t.note ?? '',
      ]
        .map(csv)
        .join(';'),
    );
  return new NextResponse('﻿' + linhas.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lancamentos.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
