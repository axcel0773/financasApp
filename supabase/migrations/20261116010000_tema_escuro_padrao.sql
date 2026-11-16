-- O app passa a ser escuro por padrão; o claro vira opção. Quem nunca escolheu ('system') passa para 'dark'.
alter table public.app_settings alter column theme set default 'dark';
update public.app_settings set theme = 'dark' where theme = 'system';
