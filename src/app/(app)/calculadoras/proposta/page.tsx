import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { SemTabelas } from '@/features/calculadoras/blocos';
import { valoresIniciais } from '@/features/calculadoras/valores-pacote';
import { CalculadoraProposta } from '@/features/calculadoras/proposta';

export const metadata = { title: tituloDe('proposta') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('proposta')} subtitle="Vale a pena trocar de emprego?" />
      {d.tabelas ? <CalculadoraProposta tabelas={d.tabelas} inicial={valoresIniciais(d)} /> : <SemTabelas />}
    </>
  );
}
