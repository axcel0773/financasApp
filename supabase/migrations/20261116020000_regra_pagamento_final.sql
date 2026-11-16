-- Regra da data do pagamento final do salário: dia fixo do mês seguinte (comportamento atual),
-- 5º dia útil do mês seguinte, ou último dia útil do próprio mês de referência.
alter table public.income_sources
  add column final_rule text not null default 'dia'
  check (final_rule in ('dia', 'quinto_dia_util', 'ultimo_dia_util'));
