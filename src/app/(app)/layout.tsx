import { garantirDadosIniciais, getContainer } from '@/composition/container';
import { LogoutForm } from '@/features/shell/logout-form';
import { ShellEffects } from '@/features/shell/shell-effects';
import { AppShell } from '@/ui/shell/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // em paralelo: a leitura de ajustes não espera a verificação de dados iniciais
  const [ajustes] = await Promise.all([(await getContainer()).settings.get(), garantirDadosIniciais()]);
  return (
    <AppShell
      sairIcone={<LogoutForm variante="icone" />}
      sairBloco={<LogoutForm />}
      extras={<ShellEffects tema={ajustes.theme} ocultar={ajustes.hideValues} />}>
      {children}
    </AppShell>
  );
}
