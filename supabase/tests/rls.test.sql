-- pgTAP: roda com `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

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
insert into public.wallets (user_id, kind, name) values
  ('00000000-0000-0000-0000-0000000000a1', 'checking', 'Conta A');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select is((select count(*)::int from public.wallets), 0, 'usuário B não lê carteira do usuário A');

update public.wallets set name = 'hack';
reset role;
select is((select name from public.wallets limit 1), 'Conta A', 'usuário B não altera carteira do usuário A');

select * from finish();
rollback;
