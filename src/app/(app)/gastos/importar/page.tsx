import { addDias } from '@/core/shared/competencia';
import { viagensParaLancar } from '@/core/trips/domain';
import { carregarBase } from '@/features/base';
import { ImportarExtrato } from '@/features/gastos/importar-extrato';
import { PageHeader } from '@/ui/primitives/card';

export const metadata = { title: 'Importar extrato' };

/** Janela de conferência de repetidos: faturas e extratos costumam cobrir os últimos 2 a 3 meses. */
const DIAS_CONFERENCIA = 120;

export default async function ImportarPage() {
  const { c, wallets, categories, hoje } = await carregarBase();
  const [regras, viagens, recentes, fixos] = await Promise.all([
    c.categories.regras(),
    c.trips.list(),
    c.transactions.list({ de: addDias(hoje, -DIAS_CONFERENCIA), ate: addDias(hoje, 45), limite: 1000 }),
    c.recurring.regras(),
  ]);
  const paraLancar = viagensParaLancar(viagens, hoje);
  const periodo = new Map(viagens.map((v) => [v.id, { startOn: v.startOn, endOn: v.endOn }]));
  return (
    <>
      <PageHeader voltar={{ href: '/gastos' }} title="Importar extrato" subtitle="CSV do seu banco ou da fatura do cartão" />
      <ImportarExtrato
        carteiras={wallets.map((w) => ({ id: w.id, nome: w.name, cartao: w.kind === 'credit_card' }))}
        categorias={categories.map((x) => ({ id: x.id, nome: x.name }))}
        regras={regras.map((r) => ({ keyword: r.keyword, categoryId: r.categoryId }))}
        viagens={paraLancar.opcoes.map((v) => ({ ...v, ...periodo.get(v.id)! }))}
        viagemAtual={paraLancar.atual}
        existentes={recentes.map((t) => ({
          occurredOn: t.occurredOn,
          cents: t.amountCents,
          kind: t.kind,
          note: t.note,
          fixo: t.origin === 'recurring',
        }))}
        fixos={fixos
          .filter((f) => f.active)
          .map((f) => ({ name: f.name, dayOfMonth: f.dayOfMonth, amountCents: f.amountCents, startOn: f.startOn }))}
      />
    </>
  );
}
