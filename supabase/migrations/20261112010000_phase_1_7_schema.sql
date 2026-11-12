-- Fases 1-7: tabelas restantes. Dinheiro em centavos; RLS em todas; user_id default auth.uid().
create type income_kind as enum ('salary','thirteenth','plr','extra');
create type receipt_kind as enum ('advance','final','thirteenth_1','thirteenth_2','vacation','plr','extra');
create type goal_kind as enum ('emergency','other');
create type investment_kind as enum ('fixed_income','treasury','stocks','funds','crypto','other');
create type tax_kind as enum ('inss','irrf');
create type tx_origin as enum ('manual','recurring','installment');

alter table public.wallets
  add column opening_cents bigint not null default 0,
  add column archived boolean not null default false;
alter table public.categories
  add column icon text check (char_length(icon) <= 40),
  add column sort_order smallint not null default 0;

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  amount_cents bigint not null check (amount_cents > 0),
  category_id uuid references public.categories(id) on delete set null,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  active boolean not null default true,
  start_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 80),
  total_cents bigint not null check (total_cents > 0),
  installments smallint not null check (installments between 2 and 120),
  first_on date not null,
  category_id uuid references public.categories(id) on delete set null,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column origin tx_origin not null default 'manual',
  add column recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  add column installment_plan_id uuid references public.installment_plans(id) on delete set null,
  add column installment_number smallint check (installment_number >= 1);
create unique index transactions_recurring_once on public.transactions (recurring_rule_id, occurred_on) where recurring_rule_id is not null;
create unique index transactions_installment_once on public.transactions (installment_plan_id, installment_number) where installment_plan_id is not null;
create index transactions_user_cat_date_idx on public.transactions (user_id, category_id, occurred_on) where deleted_at is null;
create index recurring_rules_user_idx on public.recurring_rules (user_id);
create index recurring_rules_wallet_idx on public.recurring_rules (wallet_id);
create index recurring_rules_category_idx on public.recurring_rules (category_id);
create index installment_plans_user_idx on public.installment_plans (user_id);
create index installment_plans_wallet_idx on public.installment_plans (wallet_id);
create index installment_plans_category_idx on public.installment_plans (category_id);

create table public.transaction_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  old_amount_cents bigint not null,
  new_amount_cents bigint not null,
  old_note text,
  new_note text,
  changed_at timestamptz not null default now()
);
create index transaction_history_tx_idx on public.transaction_history (transaction_id, changed_at desc);
create index transaction_history_user_idx on public.transaction_history (user_id);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind income_kind not null default 'salary',
  name text not null check (char_length(name) between 1 and 80),
  employer text check (char_length(employer) <= 80),
  gross_cents bigint not null check (gross_cents >= 0),
  advance_percent smallint check (advance_percent between 0 and 100),
  advance_day smallint check (advance_day between 1 and 31),
  final_day smallint check (final_day between 1 and 31),
  wallet_id uuid references public.wallets(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index income_sources_user_idx on public.income_sources (user_id);
create index income_sources_wallet_idx on public.income_sources (wallet_id);

create table public.income_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_id uuid not null references public.income_sources(id) on delete cascade,
  kind receipt_kind not null,
  competencia char(7) not null check (competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  expected_on date,
  expected_net_cents bigint check (expected_net_cents >= 0),
  received_on date,
  gross_cents bigint check (gross_cents >= 0),
  deductions_cents bigint not null default 0 check (deductions_cents >= 0),
  net_cents bigint check (net_cents >= 0),
  wallet_id uuid references public.wallets(id) on delete set null,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((received_on is null) = (net_cents is null))
);
create unique index income_receipts_once on public.income_receipts (source_id, competencia, kind) where kind <> 'extra';
create index income_receipts_user_date_idx on public.income_receipts (user_id, received_on);
create index income_receipts_source_idx on public.income_receipts (source_id);
create index income_receipts_wallet_idx on public.income_receipts (wallet_id);

create table public.benefit_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  credited_on date not null,
  amount_cents bigint not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  unique (wallet_id, credited_on)
);
create index benefit_credits_user_idx on public.benefit_credits (user_id, credited_on desc);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind goal_kind not null default 'other',
  name text not null check (char_length(name) between 1 and 80),
  target_cents bigint not null check (target_cents > 0),
  current_cents bigint not null default 0 check (current_cents >= 0),
  deadline date,
  planned_monthly_cents bigint check (planned_monthly_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_idx on public.goals (user_id);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind investment_kind not null default 'other',
  name text not null check (char_length(name) between 1 and 80),
  institution text check (char_length(institution) <= 80),
  annual_rate_percent numeric(7,3) check (annual_rate_percent >= 0),
  maturity_on date,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investments_user_idx on public.investments (user_id);

create table public.investment_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  occurred_on date not null,
  amount_cents bigint not null check (amount_cents <> 0),
  created_at timestamptz not null default now()
);
create index investment_entries_inv_idx on public.investment_entries (investment_id, occurred_on desc);
create index investment_entries_user_idx on public.investment_entries (user_id);

create table public.investment_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  balance_on date not null,
  balance_cents bigint not null check (balance_cents >= 0),
  created_at timestamptz not null default now(),
  unique (investment_id, balance_on)
);
create index investment_balances_user_idx on public.investment_balances (user_id);

create table public.tax_tables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind tax_kind not null,
  valid_from date not null,
  brackets jsonb not null check (jsonb_typeof(brackets) = 'array'),
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, kind, valid_from)
);

create table public.app_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ipca_expected_percent numeric(6,3) not null default 4.5 check (ipca_expected_percent >= 0),
  cdi_expected_percent numeric(6,3) not null default 14.0 check (cdi_expected_percent >= 0),
  min_balance_cents bigint not null default 0,
  hide_values boolean not null default false,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  updated_at timestamptz not null default now()
);

-- RLS: dono em todas as tabelas novas
do $$
declare t text;
begin
  foreach t in array array['recurring_rules','installment_plans','income_sources','income_receipts','benefit_credits',
    'goals','investments','investment_entries','investment_balances','tax_tables','app_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "%1$s_owner_all" on public.%1$I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Histórico: só leitura e inserção (auditoria imutável)
alter table public.transaction_history enable row level security;
create policy "transaction_history_owner_select" on public.transaction_history for select to authenticated using (user_id = (select auth.uid()));
create policy "transaction_history_owner_insert" on public.transaction_history for insert to authenticated with check (user_id = (select auth.uid()));
revoke all on public.transaction_history from anon;
revoke update, delete on public.transaction_history from authenticated;

create or replace function public.log_transaction_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.amount_cents is distinct from old.amount_cents or new.note is distinct from old.note
     or new.category_id is distinct from old.category_id then
    insert into public.transaction_history (user_id, transaction_id, old_amount_cents, new_amount_cents, old_note, new_note)
    values (new.user_id, new.id, old.amount_cents, new.amount_cents, old.note, new.note);
  end if;
  return new;
end $$;
create trigger transactions_history after update on public.transactions for each row execute function public.log_transaction_change();

create trigger recurring_rules_touch before update on public.recurring_rules for each row execute function public.touch_updated_at();
create trigger income_sources_touch before update on public.income_sources for each row execute function public.touch_updated_at();
create trigger income_receipts_touch before update on public.income_receipts for each row execute function public.touch_updated_at();
create trigger goals_touch before update on public.goals for each row execute function public.touch_updated_at();
create trigger investments_touch before update on public.investments for each row execute function public.touch_updated_at();
create trigger app_settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();

-- Views (security_invoker: respeitam o RLS do usuário)
create view public.v_monthly_summary with (security_invoker = true) as
with spent as (
  select t.user_id, to_char(t.occurred_on, 'YYYY-MM') as competencia,
    coalesce(sum(t.amount_cents) filter (where t.kind = 'expense' and w.kind not in ('meal_voucher','food_voucher')), 0) as spent_cents,
    coalesce(sum(t.amount_cents) filter (where t.kind = 'expense' and w.kind in ('meal_voucher','food_voucher')), 0) as benefit_spent_cents,
    coalesce(sum(t.amount_cents) filter (where t.kind = 'income'), 0) as other_income_cents
  from public.transactions t join public.wallets w on w.id = t.wallet_id
  where t.deleted_at is null group by 1, 2
), rec as (
  select user_id, to_char(received_on, 'YYYY-MM') as competencia, sum(net_cents) as received_cents
  from public.income_receipts where received_on is not null group by 1, 2
)
select coalesce(s.user_id, r.user_id) as user_id,
  coalesce(s.competencia, r.competencia) as competencia,
  coalesce(r.received_cents, 0) + coalesce(s.other_income_cents, 0) as received_cents,
  coalesce(s.spent_cents, 0) as spent_cents,
  coalesce(s.benefit_spent_cents, 0) as benefit_spent_cents,
  coalesce(r.received_cents, 0) + coalesce(s.other_income_cents, 0) - coalesce(s.spent_cents, 0) as leftover_cents
from spent s full join rec r on r.user_id = s.user_id and r.competencia = s.competencia;

create view public.v_wallet_balance with (security_invoker = true) as
select w.id as wallet_id, w.user_id, w.kind, w.name,
  w.opening_cents
  + coalesce((select sum(amount_cents) from public.benefit_credits c where c.wallet_id = w.id), 0)
  + coalesce((select sum(net_cents) from public.income_receipts r where r.wallet_id = w.id and r.received_on is not null), 0)
  + coalesce((select sum(case when t.kind = 'income' then t.amount_cents else -t.amount_cents end)
      from public.transactions t where t.wallet_id = w.id and t.deleted_at is null and t.kind in ('income','expense')), 0)
  as balance_cents
from public.wallets w;

create view public.v_category_spend with (security_invoker = true) as
select t.user_id, t.category_id, to_char(t.occurred_on, 'YYYY-MM') as competencia, sum(t.amount_cents) as spent_cents
from public.transactions t join public.wallets w on w.id = t.wallet_id
where t.deleted_at is null and t.kind = 'expense'
group by 1, 2, 3;

revoke all on public.v_monthly_summary, public.v_wallet_balance, public.v_category_spend from anon;
grant select on public.v_monthly_summary, public.v_wallet_balance, public.v_category_spend to authenticated;

-- Dados iniciais do usuário (carteiras, categorias, ajustes e tabelas de imposto editáveis)
create or replace function public.seed_defaults() returns void
language plpgsql set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.wallets where user_id = uid) then
    insert into public.wallets (kind, name, closing_day, due_day) values
      ('checking', 'Conta corrente', null, null),
      ('meal_voucher', 'Vale-refeição', null, null),
      ('food_voucher', 'Vale-alimentação', null, null),
      ('credit_card', 'Cartão de crédito', 25, 5),
      ('cash', 'Dinheiro', null, null);
  end if;
  if not exists (select 1 from public.categories where user_id = uid) then
    insert into public.categories (name, color, sort_order) values
      ('Moradia', '#0B5D45', 1), ('Mercado', '#2F8F6B', 2), ('Restaurantes', '#B54708', 3),
      ('Transporte', '#1E40AF', 4), ('Saúde', '#B42318', 5), ('Lazer', '#7A3E9D', 6),
      ('Assinaturas', '#475467', 7), ('Educação', '#0E7490', 8), ('Compras', '#9A6700', 9), ('Outros', '#667085', 10);
  end if;
  insert into public.app_settings (user_id) values (uid) on conflict do nothing;
  -- Tabelas vigentes em 2026 (Portaria MPS/MF 13/2026 e Lei 15.270/2025). EDITÁVEIS: confira na Receita/INSS.
  insert into public.tax_tables (kind, valid_from, brackets, params) values
    ('inss', '2026-01-01',
      '[{"up_to_cents":162100,"rate":0.075,"deduction_cents":0},{"up_to_cents":290284,"rate":0.09,"deduction_cents":0},{"up_to_cents":435427,"rate":0.12,"deduction_cents":0},{"up_to_cents":847555,"rate":0.14,"deduction_cents":0}]'::jsonb,
      '{}'::jsonb),
    ('irrf', '2026-01-01',
      '[{"up_to_cents":242880,"rate":0,"deduction_cents":0},{"up_to_cents":282665,"rate":0.075,"deduction_cents":18216},{"up_to_cents":375105,"rate":0.15,"deduction_cents":39416},{"up_to_cents":466468,"rate":0.225,"deduction_cents":67549},{"up_to_cents":null,"rate":0.275,"deduction_cents":90873}]'::jsonb,
      '{"dependent_cents":18959,"simplified_cents":60720,"reducer":{"exempt_until_cents":500000,"phase_until_cents":735000,"a_cents":97862,"b":0.133145}}'::jsonb)
  on conflict (user_id, kind, valid_from) do nothing;
end $$;
revoke execute on function public.seed_defaults() from anon, public;
grant execute on function public.seed_defaults() to authenticated;
