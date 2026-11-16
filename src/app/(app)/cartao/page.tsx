import { ButtonLink } from '@/ui/primitives/button';
import { salvarCartaoAction } from '@/app/_actions/planejamento';
import { agruparFaturas, competenciaDaFatura } from '@/core/card-invoices/domain';
import { addMeses } from '@/core/shared/competencia';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, competenciaDoParam, dataCurta, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/primitives/progress';
import { totaisPorCategoria } from '@/core/reports/domain';
import { Ring } from '@/ui/charts/ring';
import { CategoryBreakdown } from '@/ui/patterns/category-breakdown';
import { Recolhivel } from '@/ui/patterns/collapsible';
import { MonthSwitch } from '@/ui/patterns/month-switch';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';

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

  const limite = cartao.limitCents ?? null;
  const pctLimite = limite ? (abertas / limite) * 100 : null;
  const comprasFatura = fatura?.compras ?? [];
  const maior = comprasFatura.reduce<(typeof comprasFatura)[number] | null>(
    (m, cp) => (!m || cp.amountCents > m.amountCents ? cp : m),
    null,
  );
  const porCategoria = totaisPorCategoria(
    comprasFatura.map((cp) => ({ categoryId: porId.get(cp.id)?.categoryId ?? null, cents: cp.amountCents })),
    categories.map((x) => ({ id: x.id, name: x.name, color: x.color })),
  ).map((f) => ({ id: f.categoryId, nome: f.name, cor: f.categoryId ? f.color : null, cents: f.cents, pct: f.pct }));
  const fechaEm = fatura?.fechaEm ?? `${sel}-${String(fecha).padStart(2, '0')}`;
  const venceEm = fatura?.venceEm ?? `${addMeses(sel, 1)}-${String(vence).padStart(2, '0')}`;

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Fatura do cartão" subtitle={cartao.name} />
      <MonthSwitch
        anterior={`/cartao?fatura=${addMeses(sel, -1)}`}
        proximo={`/cartao?fatura=${addMeses(sel, 1)}`}
        rotulo={`${rotuloCompetencia(sel)}${sel === atual ? ' · atual' : ''}`}
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6">
        <div className="space-y-3">
          <Hero>
            <p className="text-sm text-white/75">Total da fatura</p>
            <AmountDisplay cents={fatura?.totalCents ?? 0} tom="onDark" size="xl" />
            <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
              <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                <p className="text-white/75">Fecha em</p>
                <p className="text-lg font-semibold">{dataCurta(fechaEm)}</p>
              </div>
              <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                <p className="text-white/75">Vence em</p>
                <p className="text-lg font-semibold">{dataCurta(venceEm)}</p>
              </div>
            </div>
          </Hero>
          <GradeWidgets colunas={2}>
            <Widget
              rotulo="Limite usado"
              valor={<AmountDisplay cents={abertas} size="md" />}
              contexto={limite ? `${Math.round(pctLimite!)}% de ${centavosParaCampo(limite)}` : 'Sem limite informado'}
              visual={<Ring pct={pctLimite ?? 0} alerta={(pctLimite ?? 0) >= 90} />}
            />
            <Widget
              rotulo="Disponível"
              valor={limite ? <AmountDisplay cents={Math.max(0, limite - abertas)} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto="Faturas não vencidas contam como usado"
              visual={<IconeRedondo nome="card" />}
            />
            <Widget
              rotulo="Compras nesta fatura"
              valor={<span className="text-lg font-semibold">{comprasFatura.length}</span>}
              contexto={comprasFatura.length ? `média ${centavosParaCampo(Math.round((fatura?.totalCents ?? 0) / comprasFatura.length))}` : 'Nenhuma ainda'}
              visual={<IconeRedondo nome="list" />}
            />
            <Widget
              rotulo="Maior compra"
              valor={maior ? <AmountDisplay cents={maior.amountCents} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto={maior ? (porId.get(maior.id)?.note ?? 'Compra') : 'Nenhuma ainda'}
              visual={<IconeRedondo nome="trend" />}
            />
          </GradeWidgets>
          {porCategoria.length > 0 && (
            <Card>
              <h2 className="mb-3 font-display text-base font-semibold">Para onde foi</h2>
              <CategoryBreakdown titulo="Compras da fatura por categoria" itens={porCategoria.slice(0, 6)} />
            </Card>
          )}
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
                    compacto
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
          <ButtonLink href={`/gastos?carteira=${cartao.id}`} variant="secondary" block className="mt-3">
            Ver todas as compras do cartão
          </ButtonLink>
          <Recolhivel titulo="Fechamento, vencimento e limite" className="mt-3">
            <ActionForm action={salvarCartaoAction} submitLabel="Salvar" className="space-y-3">
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
                <MoneyInput name="limit" defaultValue={cartao.limitCents ? centavosParaCampo(cartao.limitCents) : ''} />
              </Field>
            </ActionForm>
          </Recolhivel>
        </div>
      </div>
    </>
  );
}
