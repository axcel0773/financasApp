-- "Como está o mês" no Início: meta de poupança (% da renda) e a origem dos lançamentos na agregação,
-- para separar o que é comprometido (fixos e parcelas) do gasto do dia a dia.
alter table public.app_settings
  add column savings_goal_percent numeric(5,2) not null default 20
  check (savings_goal_percent between 0 and 90);

drop function if exists public.gastos_agregados(date, date);
create function public.gastos_agregados(p_de date, p_ate date)
returns table (
  wallet_id uuid, wallet_kind text, category_id uuid, kind text,
  amount_cents bigint, occurred_on date, trip_id uuid, origin text
)
language sql stable security invoker set search_path = '' as $$
  select t.wallet_id, w.kind::text, t.category_id, t.kind::text,
         sum(t.amount_cents)::bigint, t.occurred_on, t.trip_id, t.origin::text
  from public.transactions t
  join public.wallets w on w.id = t.wallet_id
  where t.deleted_at is null and t.occurred_on between p_de and p_ate
  group by t.wallet_id, w.kind, t.category_id, t.kind, t.occurred_on, t.trip_id, t.origin
  order by t.occurred_on, t.wallet_id, t.category_id nulls first, t.kind::text, t.trip_id nulls first, t.origin::text
$$;
revoke all on function public.gastos_agregados(date, date) from public, anon;
grant execute on function public.gastos_agregados(date, date) to authenticated;
