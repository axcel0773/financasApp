-- Apaga definitivamente itens da lixeira com mais de 30 dias (DIAS_LIXEIRA).
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('purge-trash-30d', '15 3 * * *',
  $$delete from public.transactions where deleted_at is not null and deleted_at < now() - interval '30 days'$$);
