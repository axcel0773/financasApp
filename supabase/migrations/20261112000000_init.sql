-- Fase 0: base com RLS em todas as tabelas. Valores monetários em centavos (bigint).
create type wallet_kind as enum ('checking','meal_voucher','food_voucher','credit_card','cash');
create type tx_kind as enum ('expense','income','transfer');

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind wallet_kind not null,
  name text not null check (char_length(name) between 1 and 60),
  closing_day smallint check (closing_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  limit_cents bigint check (limit_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text check (color ~ '^#[0-9a-fA-F]{6}$'),
  monthly_budget_cents bigint check (monthly_budget_cents >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,                       -- idempotência para escrita offline
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  kind tx_kind not null,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  note text check (char_length(note) <= 200),
  deleted_at timestamptz,                         -- soft delete (lixeira 30 dias)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc) where deleted_at is null;

-- RLS + políticas do dono para todas as tabelas
do $$
declare t text;
begin
  foreach t in array array['wallets','categories','transactions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "%1$s_owner_all" on public.%1$I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger wallets_touch before update on public.wallets for each row execute function public.touch_updated_at();
create trigger transactions_touch before update on public.transactions for each row execute function public.touch_updated_at();
