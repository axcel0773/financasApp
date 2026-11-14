import { NovoLancamentoForm } from '@/features/gastos/novo-lancamento-form';
import { carregarBase, opcoesLancamento } from '@/features/base';
import { PageHeader } from '@/ui/primitives/card';
import { ButtonLink } from '@/ui/primitives/button';

export const metadata = { title: 'Novo lançamento' };

export default async function NovoPage() {
  const { wallets, categories, hoje } = await carregarBase();
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
      <NovoLancamentoForm {...opcoesLancamento({ wallets, categories })} hoje={hoje} />
    </>
  );
}
