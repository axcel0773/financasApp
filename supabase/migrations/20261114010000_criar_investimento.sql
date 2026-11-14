-- Cria o investimento e, se houver saldo informado no cadastro, o saldo do dia e o aporte correspondente,
-- tudo numa transação só (antes eram três gravações separadas e uma falha deixava o cadastro pela metade).
-- SECURITY INVOKER: o RLS do usuário continua valendo.
create or replace function public.criar_investimento(
  p_kind public.investment_kind,
  p_name text,
  p_institution text,
  p_rate numeric,
  p_maturity date,
  p_balance_cents bigint,
  p_on date
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into public.investments (kind, name, institution, annual_rate_percent, maturity_on)
  values (p_kind, p_name, p_institution, p_rate, p_maturity)
  returning id into v_id;
  if p_balance_cents is not null and p_balance_cents > 0 then
    insert into public.investment_balances (investment_id, balance_on, balance_cents)
    values (v_id, p_on, p_balance_cents);
    insert into public.investment_entries (investment_id, occurred_on, amount_cents)
    values (v_id, p_on, p_balance_cents);
  end if;
  return v_id;
end $$;

revoke all on function public.criar_investimento(public.investment_kind, text, text, numeric, date, bigint, date) from public, anon;
grant execute on function public.criar_investimento(public.investment_kind, text, text, numeric, date, bigint, date) to authenticated;
