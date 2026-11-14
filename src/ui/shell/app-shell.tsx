import { ToastProvider } from '../primitives/toast';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';

/** Mobile: coluna única + BottomNav. ≥640 centralizado. ≥768 trilho. ≥1024 sidebar + conteúdo largo. */
export function AppShell({
  children,
  topbar,
  extras,
  sairIcone,
  sairBloco,
}: {
  children: React.ReactNode;
  /** Barra superior do desktop (vem de fora: `ui` não conhece `features`). */
  topbar?: React.ReactNode;
  extras?: React.ReactNode;
  /** Botão de sair da barra lateral: só ícone no trilho (768–1023px) e com texto na sidebar larga. */
  sairIcone?: React.ReactNode;
  sairBloco?: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <Sidebar sairIcone={sairIcone} sairBloco={sairBloco} />
      <div className="md:ml-20 lg:ml-60">
        {topbar}
        <main className="mx-auto w-full max-w-xl px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 md:max-w-3xl md:pb-10 lg:max-w-[1280px] lg:px-8 lg:pt-7 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
      {extras}
    </ToastProvider>
  );
}
