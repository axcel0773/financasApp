-- O saldo atual só considera movimentos até hoje (fuso de São Paulo); datas futuras entram na projeção do fluxo de caixa.
create or replace view public.v_wallet_balance with (security_invoker = true) as
select w.id as wallet_id, w.user_id, w.kind, w.name,
  w.opening_cents
  + coalesce((select sum(amount_cents) from public.benefit_credits c where c.wallet_id = w.id and c.credited_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  + coalesce((select sum(net_cents) from public.income_receipts r where r.wallet_id = w.id and r.received_on is not null and r.received_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  + coalesce((select sum(case when t.kind = 'income' then t.amount_cents else -t.amount_cents end)
      from public.transactions t where t.wallet_id = w.id and t.deleted_at is null and t.kind in ('income','expense')
        and t.occurred_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  as balance_cents
from public.wallets w;
