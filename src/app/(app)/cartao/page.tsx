import Link from 'next/link';
import { salvarCartaoAction } from '@/app/_actions/planejamento';
import { agruparFaturas, competenciaDaFatura } from '@/core/card-invoices/domain';
import { addMeses } from '@/core/shared/competencia';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, competenciaDoParam, dataCurta, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { FilterChip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { EmptyState, ProgressBar } from '@/ui/primitives/progress';

export const metadata = { title: 'Fatura do cartão' };

export default async function CartaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { c, wallets, categories, hoje, mesAtual } = await carregarBase();
  const cartao = wallets.find((w) => w.kind === 'credit_card');
  if (!cartao)
    return (
      <>
        <PageHeader voltar={{ href: '/mais' }} title="Fatura do cartão" />
        <EmptyState title="Nenhum cartão cadastrado" />
      </>
    );
  const fecha = cartao.closingDay ?? 25,
    vence = cartao.dueDay ?? 5;
  const compras = (
    await c.transactions.list({
      walletId: cartao.id,
      de: `${addMeses(mesAtual, -6)}-01`,
      limite: 1000,
    })
  ).filter((t) => t.kind === 'expense');
  const faturas = agruparFaturas(
    compras.map((t) => ({ id: t.id, date: t.occurredOn, amountCents: t.amountCents })),
    fecha,
    vence,
  );
  const atual = competenciaDaFatura(hoje, fecha);
  const sel = competenciaDoParam(sp.fatura, atual);
  const fatura = faturas.find((f) => f.competencia === sel);
  const abertas = faturas.filter((f) => f.venceEm >= hoje).reduce((s, f) => s + f.totalCents, 0);
  const cats = new Map(categories.map((x) => [x.id, x]));
  const porId = new Map(compras.map((t) => [t.id, t]));
  const nav = [
    ...new Set([addMeses(atual, -2), addMeses(atual, -1), atual, addMeses(atual, 1), sel]),
  ].sort();

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Fatura do cartão" subtitle={cartao.name} />
      <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
        {nav.map((m) => (
          <FilterChip key={m} href={`/cartao?fatura=${m}`} ativo={m === sel}>
            {rotuloCompetencia(m).split(' de ')[0]}
            {m === atual ? ' (atual)' : ''}
          </FilterChip>
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <Hero>
            <p className="text-sm opacity-80">Fatura de {rotuloCompetencia(sel)}</p>
            <AmountDisplay cents={fatura?.totalCents ?? 0} tom="onDark" size="xl" />
            <p className="mt-1 text-sm opacity-80">
              Fecha em {dataCurta(fatura?.fechaEm ?? `${sel}-${String(fecha).padStart(2, '0')}`)} ·
              vence em {dataCurta(fatura?.venceEm ?? `${sel}-${String(vence).padStart(2, '0')}`)}
            </p>
          </Hero>
          {cartao.limitCents ? (
            <Card className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Limite usado (faturas em aberto)</span>
                <span className="amount">
                  {centavosParaCampo(abertas)} de {centavosParaCampo(cartao.limitCents)}
                </span>
              </div>
              <ProgressBar
                pct={(abertas / cartao.limitCents) * 100}
                tom={abertas / cartao.limitCents >= 0.9 ? 'alert' : 'ok'}
                label="Limite do cartão usado"
              />
            </Card>
          ) : null}
          <SectionTitle>Configurar cartão</SectionTitle>
          <details className="rounded-lg border border-border bg-surface p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary">
              Fechamento, vencimento e limite
            </summary>
            <ActionForm action={salvarCartaoAction} submitLabel="Salvar" className="mt-3 space-y-3">
              <input type="hidden" name="id" value={cartao.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dia de fechamento">
                  <Input name="closingDay" inputMode="numeric" defaultValue={fecha} required />
                </Field>
                <Field label="Dia de vencimento">
                  <Input name="dueDay" inputMode="numeric" defaultValue={vence} required />
                </Field>
              </div>
              <Field label="Limite (opcional)">
                <MoneyInput
                  name="limit"
                  defaultValue={cartao.limitCents ? centavosParaCampo(cartao.limitCents) : ''}
                />
              </Field>
            </ActionForm>
          </details>
        </div>
        <div>
          <SectionTitle>Compras da fatura</SectionTitle>
          {!fatura ? (
            <EmptyState title="Sem compras nesta fatura" />
          ) : (
            <Card className="px-4 py-1">
              {fatura.compras.map((cp) => {
                const t = porId.get(cp.id)!;
                return (
                  <TransactionRow
                    key={cp.id}
                    t={{
                      id: t.id,
                      href: `/gastos/${t.id}`,
                      descricao: t.note ?? 'Compra',
                      categoria:
                        t.categoryId && cats.get(t.categoryId)
                          ? {
                              nome: cats.get(t.categoryId)!.name,
                              cor: cats.get(t.categoryId)!.color ?? '#667085',
                            }
                          : null,
                      carteira: cartao.name,
                      data: dataCurta(t.occurredOn),
                      cents: t.amountCents,
                      kind: 'expense',
                    }}
                  />
                );
              })}
            </Card>
          )}
          <p className="mt-3 text-center text-sm">
            <Link
              href={`/gastos?carteira=${cartao.id}`}
              className="inline-flex min-h-11 items-center text-primary underline"
            >
              Ver todas as compras do cartão
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
