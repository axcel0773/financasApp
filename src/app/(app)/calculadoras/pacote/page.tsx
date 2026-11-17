import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { SemTabelas } from '@/features/calculadoras/blocos';
import { CalculadoraPacote } from '@/features/calculadoras/pacote';
import { valoresIniciais } from '@/features/calculadoras/valores-pacote';

export const metadata = { title: tituloDe('pacote') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('pacote')} subtitle="Tudo o que o emprego CLT te paga, em reais" />
      {d.tabelas ? <CalculadoraPacote tabelas={d.tabelas} inicial={valoresIniciais(d)} /> : <SemTabelas />}
    </>
  );
}
