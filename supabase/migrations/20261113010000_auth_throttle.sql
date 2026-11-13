-- Limite de tentativas de login / "esqueci a senha". Tabela em schema privado (não exposto pela API);
-- o acesso é só pelas funções abaixo. As chaves são HMAC com segredo do servidor, então quem chama
-- a API direto não consegue zerar nem bloquear a conta de outra pessoa.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.auth_throttle (
  key text primary key check (char_length(key) <= 64),
  fails int not null default 0,
  window_start timestamptz not null default now(),
  blocked_until timestamptz
);
alter table private.auth_throttle enable row level security;
create index if not exists auth_throttle_window_idx on private.auth_throttle (window_start);

-- segundos restantes de bloqueio (0 = liberado)
create or replace function public.auth_throttle_check(p_key text)
returns int language sql security definer set search_path = '' stable as $$
  select coalesce((
    select greatest(ceil(extract(epoch from (blocked_until - now())))::int, 0)
    from private.auth_throttle where key = p_key
  ), 0)
$$;

-- registra uma falha; bloqueia ao atingir p_max dentro da janela. Devolve os segundos de bloqueio.
create or replace function public.auth_throttle_fail(p_key text, p_max int, p_window_s int, p_block_s int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  r private.auth_throttle;
  v_fails int;
  v_start timestamptz;
  v_blocked timestamptz;
begin
  if char_length(p_key) > 64 or p_max < 1 or p_window_s < 1 or p_block_s < 1 then
    raise exception 'parâmetros inválidos';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from private.auth_throttle where window_start < now() - interval '1 day' and blocked_until is null;
  select * into r from private.auth_throttle where key = p_key;
  if not found or r.window_start < now() - make_interval(secs => p_window_s) then
    v_fails := 1; v_start := now(); v_blocked := null;
  else
    v_fails := r.fails + 1; v_start := r.window_start; v_blocked := r.blocked_until;
  end if;
  if v_fails >= p_max then
    v_blocked := now() + make_interval(secs => p_block_s);
  end if;
  insert into private.auth_throttle (key, fails, window_start, blocked_until)
  values (p_key, v_fails, v_start, v_blocked)
  on conflict (key) do update set fails = excluded.fails, window_start = excluded.window_start, blocked_until = excluded.blocked_until;
  return coalesce(greatest(ceil(extract(epoch from (v_blocked - now())))::int, 0), 0);
end $$;

create or replace function public.auth_throttle_clear(p_key text)
returns void language sql security definer set search_path = '' as $$
  delete from private.auth_throttle where key = p_key
$$;

revoke all on function public.auth_throttle_check(text) from public;
revoke all on function public.auth_throttle_fail(text, int, int, int) from public;
revoke all on function public.auth_throttle_clear(text) from public;
grant execute on function public.auth_throttle_check(text) to anon, authenticated;
grant execute on function public.auth_throttle_fail(text, int, int, int) to anon, authenticated;
grant execute on function public.auth_throttle_clear(text) to anon, authenticated;
