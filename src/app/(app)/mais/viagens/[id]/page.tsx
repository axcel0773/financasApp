import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { criarGastoViagemAction, excluirViagemAction } from '@/app/_actions/viagens';
import { ehBeneficio } from '@/core/wallets/domain';
import { estadoViagem, resumirViagem } from '@/core/trips/domain';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { FormViagem } from '@/features/viagens/form-viagem';
import { centavosParaCampo, dataCurta } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Ring } from '@/ui/charts/ring';
import { Recolhivel } from '@/ui/patterns/collapsible';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { CategoryBreakdown } from '@/ui/patterns/category-breakdown';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';

export const metadata = { title: 'Viagem' };
const brl = (n: number) => `R$ ${centavosParaCampo(n)}`;

export default async function ViagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { c, wallets, categories, hoje } = await carregarBase();
  const [viagem, todos] = await Promise.all([c.trips.get(id), c.transactions.list({ tripId: id, limite: 500 })]);
  if (!viagem) notFound();
  const lancamentos = todos.filter((t) => t.kind === 'expense');
  const r = resumirViagem(viagem, lancamentos.map((t) => ({ categoryId: t.categoryId, cents: t.amountCents })), hoje);
  const cats = Object.fromEntries(categories.map((x) => [x.id, { nome: x.name, cor: x.color ?? '#667085' }]));
  const carteiras = Object.fromEntries(wallets.map((w) => [w.id, w.name]));
  const estado = estadoViagem(viagem, hoje);
  const dataPadrao = hoje < viagem.startOn ? viagem.startOn : viagem.endOn && hoje > viagem.endOn ? viagem.endOn : hoje;

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais/viagens' }}
        title={viagem.name}
        subtitle={`${viagem.endOn ? `${dataCurta(viagem.startOn)} a ${dataCurta(viagem.endOn)}` : `${dataCurta(viagem.startOn)} · volta em aberto`}${estado === 'andamento' ? (r.diasTotal === null ? ` · dia ${r.diaAtual}` : ` · dia ${r.diaAtual} de ${r.diasTotal}`) : estado === 'planejada' ? ' · planejada' : ' · concluída'}`}
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-3">
          <Hero>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-white/75">Gasto na viagem</p>
                <AmountDisplay cents={r.totalCents} tom="onDark" size="xl" />
                <p className="mt-1 text-sm text-white/75">
                  {r.usadoPct === null
                    ? 'sem orçamento definido'
                    : r.estourou
                      ? `passou ${brl(-(r.restanteCents ?? 0))} de ${brl(viagem.budgetCents)}`
                      : `restam ${brl(r.restanteCents ?? 0)} de ${brl(viagem.budgetCents)}`}
                </p>
              </div>
              {r.usadoPct !== null && (
                <Ring
                  pct={r.usadoPct}
                  size={84}
                  sobreEscuro
                  alerta={r.estourou}
                  rotulo={`${r.usadoPct}%`}
                  descricao={`${r.usadoPct}% do orçamento da viagem usado`}
                />
              )}
            </div>
          </Hero>
          <GradeWidgets colunas={3}>
            <Widget
              rotulo="Média por dia"
              valor={<AmountDisplay cents={r.mediaPorDiaCents} size="md" />}
              contexto={r.diasTotal === null ? `em ${r.diaAtual} ${r.diaAtual === 1 ? 'dia' : 'dias'}` : `dia ${r.diaAtual} de ${r.diasTotal}`}
              visual={<IconeRedondo nome="calendar" />}
            />
            <Widget
              rotulo="Pode gastar por dia"
              valor={r.podeGastarPorDiaCents !== null ? <AmountDisplay cents={r.podeGastarPorDiaCents} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto={r.diasRestantes !== null ? `${r.diasRestantes} ${r.diasRestantes === 1 ? 'dia restante' : 'dias restantes'}` : 'volta em aberto'}
              visual={<IconeRedondo nome="wallet" tom={r.estourou ? 'saida' : 'entrada'} />}
            />
            <Widget
              rotulo={viagem.people > 1 ? `Por pessoa (${viagem.people})` : 'Pessoas'}
              valor={viagem.people > 1 ? <AmountDisplay cents={r.porPessoaCents} size="md" /> : <span className="text-lg font-semibold">1</span>}
              contexto={viagem.people > 1 ? 'divisão igual' : 'só você'}
              visual={<IconeRedondo nome="plane" tom="viagem" />}
            />
          </GradeWidgets>
          {estado === 'andamento' && r.podeGastarPorDiaCents !== null && <p className="text-xs text-muted">Se uma reserva grande (hospedagem, passagem) foi paga antes, ela puxa a média do dia para cima.</p>}

          <SectionTitle>Por categoria</SectionTitle>
          <Card>
            {r.porCategoria.length === 0 ? (
              <p className="text-sm text-muted">Nenhum gasto ainda.</p>
            ) : (
              <CategoryBreakdown
                titulo="Gastos da viagem por categoria"
                itens={r.porCategoria.map((f) => ({
                  id: f.categoryId,
                  nome: f.categoryId ? (cats[f.categoryId]?.nome ?? '—') : 'Sem categoria',
                  cor: f.categoryId ? (cats[f.categoryId]?.cor ?? null) : null,
                  cents: f.cents,
                  pct: f.pct,
                }))}
              />
            )}
          </Card>

          <SectionTitle>Lançamentos</SectionTitle>
          {lancamentos.length === 0 ? (
            <Card><p className="text-sm text-muted">Registre o primeiro gasto abaixo.</p></Card>
          ) : (
            <Card className="px-4 py-2">
              {lancamentos.map((t) => (
                <TransactionRow
                  compacto
                  key={t.id}
                  t={{
                    id: t.id,
                    href: `/gastos/${t.id}`,
                    descricao: t.note ?? cats[t.categoryId ?? '']?.nome ?? 'Lançamento',
                    categoria: t.categoryId ? (cats[t.categoryId] ?? null) : null,
                    carteira: carteiras[t.walletId] ?? '',
                    data: dataCurta(t.occurredOn),
                    cents: t.amountCents,
                    kind: t.kind,
                  }}
                />
              ))}
            </Card>
          )}
        </div>

        <div className="space-y-3 lg:sticky lg:top-20">
          <SectionTitle>Novo gasto da viagem</SectionTitle>
          <Card>
            <ActionForm action={criarGastoViagemAction} submitLabel="Registrar gasto">
              <input type="hidden" name="clientId" value={randomUUID()} />
              <input type="hidden" name="tripId" value={id} />
              <Field label="Valor"><MoneyInput name="amount" required /></Field>
              <Field label="Descrição"><Input name="note" maxLength={200} placeholder="Jantar, passeio, uber…" /></Field>
              <Field label="Categoria">
                <Select name="categoryId" defaultValue="">
                  <option value="">Sem categoria</option>
                  {categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </Select>
              </Field>
              <Field label="Carteira">
                <Select name="walletId" defaultValue={wallets.find((w) => !ehBeneficio(w.kind))?.id}>
                  {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
              </Field>
              <Field label="Data"><Input type="date" name="occurredOn" defaultValue={dataPadrao} required /></Field>
            </ActionForm>
          </Card>
          <Recolhivel titulo="Editar viagem">
            <FormViagem viagem={viagem} hoje={hoje} />
          </Recolhivel>
          <Card>
            <ExcluirConfirmado action={excluirViagemAction} id={viagem.id} rotulo="Excluir viagem" aviso="A viagem é apagada, mas os lançamentos dela continuam e voltam a contar como gastos normais do dia a dia." />
          </Card>
        </div>
      </div>
    </>
  );
}
