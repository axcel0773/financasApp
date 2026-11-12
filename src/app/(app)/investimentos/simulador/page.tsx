import { carregarBase } from '@/features/base';
import { SimuladorForm } from '@/features/investir/simulador-form';
import { addMeses } from '@/core/shared/competencia';
import { PageHeader } from '@/ui/primitives/card';

export const metadata = { title: 'Simulador' };

export default async function SimuladorPage() {
  const { c, mesAtual } = await carregarBase();
  const a = await c.settings.get();
  return (
    <>
      <PageHeader
        voltar={{ href: '/investimentos' }}
        title="Simulador"
        subtitle="Quanto seus aportes podem render"
      />
      <SimuladorForm ipca={a.ipcaPercent} cdi={a.cdiPercent} inicio={addMeses(mesAtual, 0)} />
    </>
  );
}
