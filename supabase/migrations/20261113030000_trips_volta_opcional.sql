-- A volta da viagem pode ser desconhecida ao cadastrar: end_on passa a aceitar nulo.
-- O check (end_on >= start_on) continua valendo quando há data (com nulo ele não reprova).
alter table public.trips alter column end_on drop not null;
