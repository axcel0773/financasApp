import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { CalculadoraHoras } from '@/features/calculadoras/horas';

export const metadata = { title: tituloDe('horas') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('horas')} subtitle="Quanto tempo de trabalho custa uma compra" />
      <CalculadoraHoras liquidoMensalCents={d.liquidoMensalCents} />
    </>
  );
}
