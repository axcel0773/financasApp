import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { CalculadoraCenario } from '@/features/calculadoras/cenario';

export const metadata = { title: tituloDe('e-se') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('e-se')} subtitle="Quanto tempo a reserva aguenta" />
      <CalculadoraCenario
        liquidoMensalCents={d.liquidoMensalCents}
        gastoMedioCents={d.gastoMedioCents}
        reservaCents={d.reservaCents}
        cdiPercent={d.cdiPercent}
      />
    </>
  );
}
