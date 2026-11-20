-- Cor de destaque escolhida em Mais → Ajustes (o padrão é o verde-limão).
alter table public.app_settings
  add column if not exists accent text not null default 'lima'
  check (accent in ('lima', 'ciano', 'azul', 'violeta', 'rosa', 'laranja'));
