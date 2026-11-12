import { carregarBase } from '@/features/base';
import { ImportarExtrato } from '@/features/gastos/importar-extrato';
import { PageHeader } from '@/ui/primitives/card';

export const metadata = { title: 'Importar extrato' };

export default async function ImportarPage() {
  const { c, wallets, categories } = await carregarBase();
  const regras = await c.categories.regras();
  return (
    <>
      <PageHeader voltar={{ href: '/gastos' }} title="Importar extrato" subtitle="CSV do seu banco" />
      <ImportarExtrato
        carteiras={wallets.map((w) => ({ id: w.id, nome: w.name }))}
        categorias={categories.map((x) => ({ id: x.id, nome: x.name }))}
        regras={regras.map((r) => ({ keyword: r.keyword, categoryId: r.categoryId }))}
      />
    </>
  );
}
