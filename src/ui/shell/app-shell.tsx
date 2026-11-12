import { ToastProvider } from '../primitives/toast';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';

/** Mobile: coluna única + BottomNav. ≥640 centralizado. ≥768 trilho. ≥1024 sidebar + conteúdo largo. */
export function AppShell({
  children,
  extras,
}: {
  children: React.ReactNode;
  extras?: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <Sidebar />
      <div className="md:ml-20 lg:ml-60">
        <main className="mx-auto w-full max-w-xl px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 md:max-w-3xl md:pb-10 lg:max-w-5xl">
          {children}
        </main>
      </div>
      <BottomNav />
      {extras}
    </ToastProvider>
  );
}
