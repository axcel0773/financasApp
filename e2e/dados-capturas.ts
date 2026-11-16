import { createClient } from '@supabase/supabase-js';

/**
 * Dados de exemplo para as capturas: grava direto no Supabase LOCAL do CI, como o usuário de teste (RLS vale).
 * Idempotente: se a meta de exemplo já existe, não faz nada.
 * Inclui um nome longo e um valor de seis dígitos de propósito, para pegar quebras de layout.
 */
export async function semearDadosDeExemplo(email: string, senha: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) return; // só no banco local
  const db = createClient(url, anon, { auth: { persistSession: false } });
  const { error: e0 } = await db.auth.signInWithPassword({ email, password: senha });
  if (e0) throw e0;
  const ok = <T>(r: { data: T | null; error: unknown }): T => {
    if (r.error) throw r.error;
    return r.data as T;
  };
  const ja = ok(await db.from('goals').select('id').eq('name', 'Reserva de emergência').limit(1));
  if (ja.length) return;

  const hoje = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dia = (n: number) => iso(new Date(hoje.getFullYear(), hoje.getMonth(), n));
  const diasAtras = (n: number) => iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - n));
  const comp = iso(hoje).slice(0, 7);

  const carteiras = ok(await db.from('wallets').select('id,kind'));
  const w = (k: string) => carteiras.find((x) => x.kind === k)!.id;
  const cats = ok(await db.from('categories').select('id,name'));
  const cat = (n: string) => cats.find((x) => x.name === n)!.id;

  ok(await db.from('wallets').update({ limit_cents: 600000 }).eq('id', w('credit_card')));
  ok(await db.from('categories').update({ monthly_budget_cents: 60000 }).eq('id', cat('Mercado')));
  ok(await db.from('categories').update({ monthly_budget_cents: 20000 }).eq('id', cat('Restaurantes')));
  ok(await db.from('categories').update({ monthly_budget_cents: 30000 }).eq('id', cat('Lazer')));

  ok(
    await db.from('recurring_rules').insert([
      { name: 'Aluguel', day_of_month: 20, amount_cents: 185000, category_id: cat('Moradia'), wallet_id: w('checking') },
      { name: 'Internet fibra', day_of_month: 14, amount_cents: 11990, category_id: cat('Moradia'), wallet_id: w('checking') },
      { name: 'Streaming de filmes e séries (plano família)', day_of_month: 3, amount_cents: 5590, category_id: cat('Assinaturas'), wallet_id: w('credit_card') },
    ]),
  );
  ok(
    await db.from('installment_plans').insert({
      description: 'Notebook',
      total_cents: 420000,
      installments: 10,
      first_on: diasAtras(95),
      category_id: cat('Compras'),
      wallet_id: w('credit_card'),
    }),
  );
  const fonte = ok(
    await db
      .from('income_sources')
      .insert({ kind: 'salary', name: 'Salário', employer: 'Empresa Exemplo', gross_cents: 980000, final_day: 5, wallet_id: w('checking') })
      .select('id')
      .single(),
  );
  ok(
    await db.from('income_receipts').insert({
      source_id: fonte!.id,
      kind: 'final',
      competencia: comp,
      expected_on: dia(5),
      expected_net_cents: 724000,
      received_on: dia(Math.min(5, hoje.getDate())),
      net_cents: 724000,
      wallet_id: w('checking'),
    }),
  );
  ok(
    await db.from('benefit_credits').insert([
      { wallet_id: w('meal_voucher'), credited_on: dia(1), amount_cents: 88000 },
      { wallet_id: w('food_voucher'), credited_on: dia(1), amount_cents: 62000 },
    ]),
  );
  ok(
    await db.from('goals').insert([
      { kind: 'emergency', name: 'Reserva de emergência', target_cents: 2400000, current_cents: 1240000 },
      { kind: 'other', name: 'Viagem para Gramado', target_cents: 400000, current_cents: 150000, deadline: iso(new Date(hoje.getFullYear() + 1, 0, 8)), planned_monthly_cents: 50000 },
    ]),
  );
  const tx = (d: string, cents: number, nota: string, categoria: string, carteira: string, kind = 'expense') => ({
    client_id: crypto.randomUUID(),
    wallet_id: w(carteira),
    category_id: categoria ? cat(categoria) : null,
    kind,
    amount_cents: cents,
    occurred_on: d,
    note: nota,
  });
  ok(
    await db.from('transactions').insert([
      tx(diasAtras(1), 21400, 'Restaurante Costa Norte', 'Restaurantes', 'credit_card'),
      tx(diasAtras(2), 8651, 'Farmácia', 'Saúde', 'credit_card'),
      tx(diasAtras(3), 28100, 'Supermercado do bairro com nome comprido demais', 'Mercado', 'credit_card'),
      tx(diasAtras(4), 5800, 'Cinema', 'Lazer', 'credit_card'),
      tx(diasAtras(2), 4200, 'Almoço', 'Restaurantes', 'meal_voucher'),
      tx(diasAtras(5), 13450, 'Feira', 'Mercado', 'food_voucher'),
      tx(diasAtras(6), 12345678, 'Entrada de exemplo com seis dígitos', '', 'checking', 'income'),
      tx(diasAtras(40), 19800, 'Supermercado', 'Mercado', 'checking'),
      tx(diasAtras(45), 9900, 'Restaurante', 'Restaurantes', 'checking'),
      tx(diasAtras(70), 31000, 'Supermercado', 'Mercado', 'checking'),
    ]),
  );
  await db.auth.signOut();
}
