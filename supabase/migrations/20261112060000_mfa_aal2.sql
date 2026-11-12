-- 2FA de verdade: quem tem autenticador (TOTP) verificado só acessa dados com sessão aal2,
-- isto é, depois de digitar o código. Vale também para chamadas diretas à API com a chave anon.
-- Quem ainda não cadastrou 2FA continua entrando normalmente (aal1).

create or replace function public.mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from auth.mfa_factors
      where user_id = (select auth.uid()) and status = 'verified'
    ) then coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    else true
  end
$$;

revoke all on function public.mfa_ok() from public, anon;
grant execute on function public.mfa_ok() to authenticated;

-- Uma política RESTRITIVA em cada tabela do schema public (é combinada com E às políticas de dono).
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and rowsecurity loop
    execute format('drop policy if exists mfa_aal2 on public.%I', t.tablename);
    execute format(
      'create policy mfa_aal2 on public.%I as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()))',
      t.tablename);
  end loop;
end $$;

-- Tabelas novas precisam da mesma política (ver README, seção Segurança).
