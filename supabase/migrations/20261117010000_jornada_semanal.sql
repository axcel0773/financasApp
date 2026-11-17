-- Jornada semanal usada no selo "custou X de trabalho" dos gastos. 0 desliga o selo.
alter table public.app_settings
  add column work_hours_week numeric(4,1) not null default 40
  check (work_hours_week between 0 and 80);
