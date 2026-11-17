import { carregarBase } from '@/features/base';
import { CalculadoraFerias } from '@/features/calculadoras/ferias';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';

export const metadata = { title: tituloDe('ferias') };

export default async function Page() {
  const { hoje } = await carregarBase();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('ferias')} subtitle="As datas que rendem mais dias de folga" />
      <CalculadoraFerias hoje={hoje} />
    </>
  );
}
