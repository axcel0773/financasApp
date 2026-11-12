import { carregarBase } from '@/features/base';
import { FormViagem } from '@/features/viagens/form-viagem';
import { Card, PageHeader } from '@/ui/primitives/card';

export const metadata = { title: 'Nova viagem' };

export default async function NovaViagemPage() {
  const { hoje } = await carregarBase();
  return (
    <>
      <PageHeader voltar={{ href: '/mais/viagens' }} title="Nova viagem" />
      <Card><FormViagem hoje={hoje} /></Card>
    </>
  );
}
