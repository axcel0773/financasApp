-- Seção B: transferências entre carteiras, regras de categorização (importação), dependentes e pensão na fonte de renda.

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  from_wallet_id uuid not null references public.wallets(id) on delete restrict,
  to_wallet_id uuid not null references public.wallets(id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  note text check (char_length(note) <= 200),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id),
  unique (user_id, client_id)
);
create index transfers_user_date_idx on public.transfers (user_id, occurred_on desc) where deleted_at is null;
create index transfers_from_idx on public.transfers (from_wallet_id);
create index transfers_to_idx on public.transfers (to_wallet_id);

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  keyword text not null check (char_length(keyword) between 2 and 60),
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, keyword)
);
create index category_rules_user_idx on public.category_rules (user_id);
create index category_rules_category_idx on public.category_rules (category_id);

alter table public.income_sources
  add column dependents smallint not null default 0 check (dependents between 0 and 20),
  add column alimony_cents bigint not null default 0 check (alimony_cents >= 0);

do $$
declare t text;
begin
  foreach t in array array['transfers','category_rules'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "%1$s_owner_all" on public.%1$I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Saldo: passa a considerar as transferências já ocorridas (entrada no destino, saída na origem).
create or replace view public.v_wallet_balance with (security_invoker = true) as
select w.id as wallet_id, w.user_id, w.kind, w.name,
  w.opening_cents
  + coalesce((select sum(amount_cents) from public.benefit_credits c where c.wallet_id = w.id and c.credited_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  + coalesce((select sum(net_cents) from public.income_receipts r where r.wallet_id = w.id and r.received_on is not null and r.received_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  + coalesce((select sum(case when t.kind = 'income' then t.amount_cents else -t.amount_cents end)
      from public.transactions t where t.wallet_id = w.id and t.deleted_at is null and t.kind in ('income','expense')
        and t.occurred_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  + coalesce((select sum(tr.amount_cents) from public.transfers tr where tr.to_wallet_id = w.id and tr.deleted_at is null
        and tr.occurred_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  - coalesce((select sum(tr.amount_cents) from public.transfers tr where tr.from_wallet_id = w.id and tr.deleted_at is null
        and tr.occurred_on <= (now() at time zone 'America/Sao_Paulo')::date), 0)
  as balance_cents
from public.wallets w;

-- Lixeira de 30 dias também limpa transferências apagadas.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-trash-30d') then
    perform cron.unschedule('purge-trash-30d');
  end if;
  perform cron.schedule('purge-trash-30d', '15 3 * * *', $c$
    delete from public.transactions where deleted_at < now() - interval '30 days';
    delete from public.transfers where deleted_at < now() - interval '30 days';
  $c$);
exception when others then null;
end $$;
