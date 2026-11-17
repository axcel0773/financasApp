import { CALCULADORAS } from '@/features/calculadoras/lista';
import { Linha, ListaCartao } from '@/ui/patterns/row';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Icon } from '@/ui/primitives/icon';
import { PageHeader } from '@/ui/primitives/card';

export const metadata = { title: 'Calculadoras' };

export default function CalculadorasPage() {
  return (
    <>
      <PageHeader
        voltar={{ href: '/mais' }}
        title="Calculadoras"
        subtitle="Contas de trabalho e dinheiro, já com o seu salário. Nada é salvo."
      />
      <ListaCartao className="lg:max-w-3xl">
        {CALCULADORAS.map((c) => (
          <Linha
            key={c.slug}
            href={`/calculadoras/${c.slug}`}
            icone={<IconeRedondo nome={c.icone} />}
            titulo={c.titulo}
            contexto={c.resumo}
            direita={<Icon name="chevron" size={18} className="text-muted" />}
          />
        ))}
      </ListaCartao>
    </>
  );
}
