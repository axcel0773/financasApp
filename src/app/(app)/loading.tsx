import { Skeleton } from '@/ui/primitives/progress';

/** Aparece na hora ao trocar de tela, enquanto o servidor busca os dados: o toque nunca parece travado. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}
