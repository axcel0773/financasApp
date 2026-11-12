-- pgTAP: roda com `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- 1) Toda tabela do schema public tem RLS ativo
select is(
  (select count(*)::int from pg_tables t join pg_class c on c.relname = t.tablename
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
   where t.schemaname = 'public' and not c.relrowsecurity),
  0, 'todas as tabelas de public têm RLS ativo');

-- 2) Toda tabela do schema public tem ao menos uma política
select is(
  (select count(*)::int from pg_tables t
   where t.schemaname = 'public'
     and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename)),
  0, 'todas as tabelas de public têm política');

-- 3) Isolamento entre usuários
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.local');
insert into public.wallets (id, user_id, kind, name) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000a1', 'checking', 'Conta A'),
  ('00000000-0000-0000-0000-00000000aa02', '00000000-0000-0000-0000-0000000000a1', 'cash', 'Dinheiro A');
insert into public.trips (user_id, name, start_on, end_on) values
  ('00000000-0000-0000-0000-0000000000a1', 'Viagem A', '2026-11-10', '2026-11-14');
insert into public.transfers (user_id, from_wallet_id, to_wallet_id, amount_cents, occurred_on, client_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000aa02', 1000, '2026-11-12', '00000000-0000-0000-0000-0000000000c1');
insert into public.categories (id, user_id, name) values
  ('00000000-0000-0000-0000-00000000cc01', '00000000-0000-0000-0000-0000000000a1', 'Mercado A');
insert into public.category_rules (user_id, category_id, keyword) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000cc01', 'mercado');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select is((select count(*)::int from public.wallets), 0, 'usuário B não lê carteira do usuário A');
select is((select count(*)::int from public.trips), 0, 'usuário B não lê viagem do usuário A');
select is((select count(*)::int from public.transfers), 0, 'usuário B não lê transferência do usuário A');
select is((select count(*)::int from public.category_rules), 0, 'usuário B não lê regras do usuário A');

update public.wallets set name = 'hack';
update public.trips set name = 'hack';
select throws_ok(
  $$insert into public.trips (user_id, name, start_on, end_on) values ('00000000-0000-0000-0000-0000000000a1', 'x', '2026-11-10', '2026-11-11')$$,
  '42501', null, 'usuário B não cria viagem em nome do usuário A');
reset role;
select is((select name from public.wallets where id = '00000000-0000-0000-0000-00000000aa01'), 'Conta A', 'usuário B não altera carteira do usuário A');
select is((select name from public.trips limit 1), 'Viagem A', 'usuário B não altera viagem do usuário A');
select is((select count(*)::int from pg_views where schemaname = 'public' and viewname like 'v\_%' and coalesce((select 'security_invoker=true' = any(c.reloptions) from pg_class c where c.relname = viewname and c.relnamespace = 'public'::regnamespace), false) = false), 0, 'views v_* são security_invoker');

select * from finish();
rollback;
