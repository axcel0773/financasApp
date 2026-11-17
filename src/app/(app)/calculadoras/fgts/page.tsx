import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { CalculadoraFgts } from '@/features/calculadoras/fgts';

export const metadata = { title: tituloDe('fgts') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('fgts')} subtitle="FGTS: sacar todo ano ou guardar para a demissão" />
      <CalculadoraFgts brutoCents={d.brutoCents} />
    </>
  );
}
