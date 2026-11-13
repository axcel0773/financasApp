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
import { TransactionHeader, TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';

export const metadata = { title: 'Viagem' };
const brl = (n: number) => `R$ ${centavosParaCampo(n)}`;

export default async function ViagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { c, wallets, categories, hoje } = await carregarBase();
  const viagem = await c.trips.get(id);
  if (!viagem) notFound();
  const lancamentos = (await c.transactions.list({ tripId: id, limite: 500 })).filter((t) => t.kind === 'expense');
  const r = resumirViagem(viagem, lancamentos.map((t) => ({ categoryId: t.categoryId, cents: t.amountCents })), hoje);
  const cats = Object.fromEntries(categories.map((x) => [x.id, { nome: x.name, cor: x.color ?? '#667085' }]));
  const carteiras = Object.fromEntries(wallets.map((w) => [w.id, w.name]));
  const estado = estadoViagem(viagem, hoje);
  const dataPadrao = hoje < viagem.startOn ? viagem.startOn : hoje > viagem.endOn ? viagem.endOn : hoje;

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais/viagens' }}
        title={viagem.name}
        subtitle={`${dataCurta(viagem.startOn)} a ${dataCurta(viagem.endOn)}${estado === 'andamento' ? ` · dia ${r.diaAtual} de ${r.diasTotal}` : estado === 'planejada' ? ' · planejada' : ' · concluída'}`}
      />
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-3">
          <div className="rounded-xl bg-[#1f3f9c] p-5 text-white">
            <p className="text-sm opacity-85">Gasto na viagem</p>
            <p className="amount font-display text-3xl font-extrabold">{brl(r.totalCents)}</p>
            {r.usadoPct !== null && (
              <>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25" aria-hidden><div className="h-full bg-white" style={{ width: `${Math.min(100, r.usadoPct)}%` }} /></div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>{r.usadoPct}% de {brl(viagem.budgetCents)}</span>
                  <span>{r.estourou ? `estourou ${brl(-(r.restanteCents ?? 0))}` : `restam ${brl(r.restanteCents ?? 0)}`}</span>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card><p className="text-xs text-muted">Média por dia</p><p className="amount font-bold">{brl(r.mediaPorDiaCents)}</p></Card>
            <Card>
              <p className="text-xs text-muted">{r.podeGastarPorDiaCents !== null ? 'Pode gastar por dia' : viagem.people > 1 ? 'Por pessoa' : 'Dias da viagem'}</p>
              <p className="amount font-bold">{r.podeGastarPorDiaCents !== null ? brl(r.podeGastarPorDiaCents) : viagem.people > 1 ? brl(r.porPessoaCents) : `${r.diasTotal}`}</p>
            </Card>
          </div>
          {viagem.people > 1 && r.podeGastarPorDiaCents !== null && <p className="text-xs text-muted">Por pessoa ({viagem.people}): {brl(r.porPessoaCents)}</p>}
          {estado === 'andamento' && r.podeGastarPorDiaCents !== null && <p className="text-xs text-muted">Se uma reserva grande (hospedagem, passagem) foi paga antes, ela puxa a média do dia para cima.</p>}

          <SectionTitle>Por categoria</SectionTitle>
          <Card className="space-y-3">
            {r.porCategoria.length === 0 && <p className="text-sm text-muted">Nenhum gasto ainda.</p>}
            {r.porCategoria.map((f) => (
              <div key={f.categoryId ?? 'sem'}>
                <div className="flex justify-between text-sm"><span>{f.categoryId ? (cats[f.categoryId]?.nome ?? '—') : 'Sem categoria'}</span><span className="amount font-semibold">{brl(f.cents)} · {f.pct.toFixed(0)}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-border" aria-hidden><div className="h-full bg-trip" style={{ width: `${f.pct}%` }} /></div>
              </div>
            ))}
          </Card>

          <SectionTitle>Lançamentos</SectionTitle>
          {lancamentos.length === 0 ? (
            <Card><p className="text-sm text-muted">Registre o primeiro gasto abaixo.</p></Card>
          ) : (
            <Card className="px-4 py-2">
              <TransactionHeader />
              {lancamentos.map((t) => (
                <TransactionRow
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

        <div className="space-y-3">
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
          <details className="rounded-lg border border-border bg-surface p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link">Editar viagem</summary>
            <div className="mt-3"><FormViagem viagem={viagem} hoje={hoje} /></div>
          </details>
          <Card>
            <ExcluirConfirmado action={excluirViagemAction} id={viagem.id} rotulo="Excluir viagem" aviso="A viagem é apagada, mas os lançamentos dela continuam e voltam a contar como gastos normais do dia a dia." />
          </Card>
          <Chip>{viagem.people} {viagem.people === 1 ? 'pessoa' : 'pessoas'}</Chip>
        </div>
      </div>
    </>
  );
}
