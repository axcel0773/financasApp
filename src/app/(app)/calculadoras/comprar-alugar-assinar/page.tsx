import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { CalculadoraAquisicao } from '@/features/calculadoras/aquisicao';

export const metadata = { title: tituloDe('comprar-alugar-assinar') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('comprar-alugar-assinar')} subtitle="Qual sai mais barato no mesmo período" />
      <CalculadoraAquisicao cdiPercent={d.cdiPercent} />
    </>
  );
}
