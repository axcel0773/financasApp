import { garantirDadosIniciais, getContainer } from '@/composition/container';
import { ShellEffects } from '@/features/shell/shell-effects';
import { AppShell } from '@/ui/shell/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await garantirDadosIniciais();
  const ajustes = await (await getContainer()).settings.get();
  return (
    <AppShell extras={<ShellEffects tema={ajustes.theme} ocultar={ajustes.hideValues} />}>
      {children}
    </AppShell>
  );
}
