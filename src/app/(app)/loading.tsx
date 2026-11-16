import { Skeleton } from '@/ui/primitives/progress';

/**
 * Aparece na hora ao trocar de tela, enquanto o servidor busca os dados: o toque nunca parece travado.
 * Tem o formato das telas (título, destaque, grade de indicadores, lista), para nada "pular" quando o conteúdo chega.
 */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="space-y-3">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-11 rounded-full" />
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
