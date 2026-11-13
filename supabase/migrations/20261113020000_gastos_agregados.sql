-- Movimentações do período já somadas no banco (uma linha por dia × carteira × categoria × tipo × viagem).
-- Antes o app lia até 5.000 linhas cruas e somava em JavaScript; agora o total é exato em qualquer volume.
-- SECURITY INVOKER (padrão): a RLS do usuário continua valendo.
create or replace function public.gastos_agregados(p_de date, p_ate date)
returns table (
  wallet_id uuid, wallet_kind text, category_id uuid, kind text,
  amount_cents bigint, occurred_on date, trip_id uuid
)
language sql stable security invoker set search_path = '' as $$
  select t.wallet_id, w.kind::text, t.category_id, t.kind::text,
         sum(t.amount_cents)::bigint, t.occurred_on, t.trip_id
  from public.transactions t
  join public.wallets w on w.id = t.wallet_id
  where t.deleted_at is null and t.occurred_on between p_de and p_ate
  group by t.wallet_id, w.kind, t.category_id, t.kind, t.occurred_on, t.trip_id
  order by t.occurred_on, t.wallet_id, t.category_id nulls first, t.kind::text, t.trip_id nulls first
$$;
revoke all on function public.gastos_agregados(date, date) from public, anon;
grant execute on function public.gastos_agregados(date, date) to authenticated;
