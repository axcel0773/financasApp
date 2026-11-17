import { carregarDadosCalculadoras } from '@/features/calculadoras/dados';
import { tituloDe } from '@/features/calculadoras/lista';
import { PageHeader } from '@/ui/primitives/card';
import { parametrosDoAno } from '@/core/calculadoras/parametros';
import { SemTabelas } from '@/features/calculadoras/blocos';
import { valoresIniciais } from '@/features/calculadoras/valores-pacote';
import { CalculadoraRegimes } from '@/features/calculadoras/regimes';

export const metadata = { title: tituloDe('clt-pj-mei') };

export default async function Page() {
  const d = await carregarDadosCalculadoras();
  return (
    <>
      <PageHeader voltar={{ href: '/calculadoras', label: 'Calculadoras' }} title={tituloDe('clt-pj-mei')} subtitle="Quanto sobra no ano em cada regime" />
      {d.tabelas ? (
        <CalculadoraRegimes tabelas={d.tabelas} parametros={parametrosDoAno(Number(d.hoje.slice(0, 4)))} inicial={valoresIniciais(d)} />
      ) : (
        <SemTabelas />
      )}
    </>
  );
}
