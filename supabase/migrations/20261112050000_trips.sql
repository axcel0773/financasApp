-- Viagens: orçamento próprio, lançamentos ligados por transactions.trip_id.
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  start_on date not null,
  end_on date not null,
  budget_cents bigint not null default 0 check (budget_cents >= 0),
  people smallint not null default 1 check (people between 1 and 20),
  created_at timestamptz not null default now(),
  check (end_on >= start_on)
);
create index trips_user_start_idx on public.trips (user_id, start_on desc);

alter table public.trips enable row level security;
create policy "trips_owner_all" on public.trips for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.trips from anon;

alter table public.transactions add column trip_id uuid references public.trips(id) on delete set null;
create index transactions_trip_idx on public.transactions (trip_id) where trip_id is not null;

-- Orçamento por categoria considera só o dia a dia: gastos de viagem têm orçamento próprio.
create or replace view public.v_category_spend with (security_invoker = true) as
select t.user_id, t.category_id,
  to_char(t.occurred_on::timestamp with time zone, 'YYYY-MM') as competencia,
  sum(t.amount_cents) as spent_cents
from public.transactions t
join public.wallets w on w.id = t.wallet_id
where t.deleted_at is null and t.kind = 'expense' and t.trip_id is null
group by t.user_id, t.category_id, to_char(t.occurred_on::timestamp with time zone, 'YYYY-MM');
