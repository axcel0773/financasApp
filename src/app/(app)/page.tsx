import { Suspense } from 'react';
import { getContainer } from '@/composition/container';
import {
  BlocoAvisos,
  BlocoBeneficios,
  BlocoGastosMes,
  BlocoViagens,
  BlocoContas,
  BlocoHero,
  BlocoOrcamento,
  BlocoRecebimentos,
  BlocoRecentes,
  BlocoTendencia,
} from '@/features/inicio/blocos';
import { HideToggle } from '@/features/shell/hide-toggle';
import { dataLonga } from '@/ui/format';
import { PageHeader } from '@/ui/primitives/card';
import { Skeleton } from '@/ui/primitives/progress';

export const metadata = { title: 'Início' };
const fallback = (h: string) => <Skeleton className={h} />;

/** RSC com streaming: cada bloco carrega sozinho, com skeleton enquanto espera. */
export default async function InicioPage() {
  const hoje = (await getContainer()).clock.hoje();
  return (
    <>
      <PageHeader title="Início" subtitle={dataLonga(hoje)} action={<div className="lg:hidden"><HideToggle /></div>} />
      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
        <div>
          <Suspense fallback={fallback('h-44')}>
            <BlocoHero />
          </Suspense>
          <Suspense fallback={null}>
            <BlocoAvisos />
          </Suspense>
          <Suspense fallback={null}>
            <BlocoGastosMes />
          </Suspense>
          <Suspense fallback={null}>
            <BlocoViagens />
          </Suspense>
          <Suspense fallback={fallback('mt-6 h-32')}>
            <BlocoOrcamento />
          </Suspense>
          <Suspense fallback={fallback('mt-6 h-24')}>
            <BlocoBeneficios />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={fallback('mt-6 h-32 lg:mt-0')}>
            <BlocoRecebimentos />
          </Suspense>
          <Suspense fallback={fallback('mt-6 h-32')}>
            <BlocoContas />
          </Suspense>
          <Suspense fallback={fallback('mt-6 h-48')}>
            <BlocoTendencia />
          </Suspense>
          <Suspense fallback={fallback('mt-6 h-48')}>
            <BlocoRecentes />
          </Suspense>
        </div>
      </div>
    </>
  );
}
