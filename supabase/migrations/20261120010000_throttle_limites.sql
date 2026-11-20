-- Limite de tentativas: as funções são chamadas sem login (a tela de login precisa delas), então
-- não podem confiar nos parâmetros de quem chama. Chave só no formato gerado pelo servidor (HMAC hex de 40),
-- limites com teto e limpeza também dos bloqueios já vencidos (a tabela não cresce sem fim).
create or replace function public.auth_throttle_fail(p_key text, p_max int, p_window_s int, p_block_s int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  r private.auth_throttle;
  v_max int := least(greatest(coalesce(p_max, 5), 1), 50);
  v_window int := least(greatest(coalesce(p_window_s, 900), 60), 86400);
  v_block int := least(greatest(coalesce(p_block_s, 900), 60), 86400);
  v_fails int;
  v_start timestamptz;
  v_blocked timestamptz;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{40}$' then
    raise exception 'chave inválida';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from private.auth_throttle
  where window_start < now() - interval '1 day'
    and (blocked_until is null or blocked_until < now());
  select * into r from private.auth_throttle where key = p_key;
  if not found or r.window_start < now() - make_interval(secs => v_window) then
    v_fails := 1; v_start := now(); v_blocked := null;
  else
    v_fails := r.fails + 1; v_start := r.window_start; v_blocked := r.blocked_until;
  end if;
  if v_fails >= v_max then
    v_blocked := now() + make_interval(secs => v_block);
  end if;
  insert into private.auth_throttle (key, fails, window_start, blocked_until)
  values (p_key, v_fails, v_start, v_blocked)
  on conflict (key) do update set fails = excluded.fails, window_start = excluded.window_start, blocked_until = excluded.blocked_until;
  return coalesce(greatest(ceil(extract(epoch from (v_blocked - now())))::int, 0), 0);
end $$;

create or replace function public.auth_throttle_clear(p_key text)
returns void language sql security definer set search_path = '' as $$
  delete from private.auth_throttle where key = p_key and p_key ~ '^[0-9a-f]{40}$'
$$;

revoke all on function public.auth_throttle_fail(text, int, int, int) from public;
revoke all on function public.auth_throttle_clear(text) from public;
grant execute on function public.auth_throttle_fail(text, int, int, int) to anon, authenticated;
grant execute on function public.auth_throttle_clear(text) to anon, authenticated;
