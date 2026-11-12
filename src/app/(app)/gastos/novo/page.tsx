import { NovoLancamentoForm } from '@/features/gastos/novo-lancamento-form';
import { carregarBase } from '@/features/base';
import { ROTULO_CARTEIRA } from '@/core/wallets/domain';
import { PageHeader } from '@/ui/primitives/card';
import { ButtonLink } from '@/ui/primitives/button';

export const metadata = { title: 'Novo lançamento' };

export default async function NovoPage() {
  const { wallets, categories, hoje } = await carregarBase();
  const inicial = wallets.find((w) => w.kind === 'checking') ?? wallets[0];
  return (
    <>
      <PageHeader
        voltar={{ href: '/gastos' }}
        title="Novo lançamento"
        action={
          <ButtonLink href="/gastos" variant="ghost">
            Cancelar
          </ButtonLink>
        }
      />
      <NovoLancamentoForm
        carteiras={wallets.map((w) => ({
          id: w.id,
          nome:
            w.kind === 'checking' || w.kind === 'cash'
              ? w.name
              : `${ROTULO_CARTEIRA[w.kind]} · ${w.name}`,
        }))}
        categorias={categories.map((c) => ({ id: c.id, nome: c.name, cor: c.color }))}
        hoje={hoje}
        carteiraInicial={inicial?.id ?? ''}
      />
    </>
  );
}
