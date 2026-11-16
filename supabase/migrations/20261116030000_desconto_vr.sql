-- Desconto do vale-refeição no holerite, em % do salário bruto (entra no pagamento final, não abate o IRRF).
alter table public.income_sources
  add column vr_discount_percent numeric(5,2) not null default 0
  check (vr_discount_percent between 0 and 100);
