import { carregarBase } from '@/features/base';
import { SimuladorHolerite } from '@/features/renda/simulador-holerite';
import { centavosParaCampo } from '@/ui/format';
import { Card, PageHeader } from '@/ui/primitives/card';

export const metadata = { title: 'Simulador de holerite' };

export default async function SimuladorPage() {
  const { c } = await carregarBase();
  const [tabelas, fontes] = await Promise.all([c.income.tabelas(), c.income.fontes()]);
  const fonte = fontes.find((f) => f.active) ?? fontes[0];
  return (
    <>
      <PageHeader voltar={{ href: '/renda' }} title="Simulador" subtitle="Holerite, 13º e férias" />
      {tabelas ? (
        <SimuladorHolerite
          tabelas={{ inss: tabelas.inss, irrf: tabelas.irrf, paramsIrrf: tabelas.paramsIrrf }}
          brutoInicial={fonte ? centavosParaCampo(fonte.grossCents) : ''}
        />
      ) : (
        <Card>Cadastre as tabelas de INSS e IRRF primeiro.</Card>
      )}
    </>
  );
}
