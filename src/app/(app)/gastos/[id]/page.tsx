import { notFound } from 'next/navigation';
import { editarLancamentoAction } from '@/app/_actions/gastos';
import { carregarBase } from '@/features/base';
import { ExcluirButton } from '@/features/gastos/acoes-gasto';
import { formatBRL } from '@/core/shared/money';
import { ActionForm } from '@/ui/patterns/action-form';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput, RadioChips, Select } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';
import { centavosParaCampo, dataLonga } from '@/ui/format';

export const metadata = { title: 'Editar gasto' };

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { c, wallets, categories } = await carregarBase();
  const t = await c.transactions.get(id);
  if (!t || t.deletedAt) notFound();
  const historico = await c.transactions.history(id);
  return (
    <>
      <PageHeader
        title="Editar lançamento"
        back={
          <ButtonLink href="/gastos" variant="ghost" className="-ml-4">
            <Icon name="back" size={18} />
            Gastos
          </ButtonLink>
        }
      />
      <ActionForm
        action={editarLancamentoAction}
        submitLabel="Salvar alterações"
        offlineEditar={{ alvoId: t.id }}
      >
        <input type="hidden" name="id" value={t.id} />
        <Field label="Valor">
          <MoneyInput name="amount" defaultValue={centavosParaCampo(t.amountCents)} required />
        </Field>
        <Field label="Carteira">
          <Select name="walletId" defaultValue={t.walletId}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium">Categoria</p>
          <RadioChips
            name="categoryId"
            defaultValue={t.categoryId ?? ''}
            options={[
              { value: '', label: 'Sem categoria' },
              ...categories.map((x) => ({ value: x.id, label: x.name })),
            ]}
          />
        </div>
        <Field label="Data">
          <Input type="date" name="occurredOn" defaultValue={t.occurredOn} required />
        </Field>
        <Field label="Descrição">
          <Input name="note" defaultValue={t.note ?? ''} maxLength={200} />
        </Field>
      </ActionForm>
      <div className="mt-3">
        <ExcluirButton id={t.id} />
      </div>
      <SectionTitle>Histórico de alterações</SectionTitle>
      {historico.length === 0 ? (
        <p className="text-sm text-muted">Sem alterações até agora.</p>
      ) : (
        <Card className="space-y-2">
          {historico.map((h) => (
            <p key={h.changedAt} className="text-sm">
              <span className="text-muted">{dataLonga(h.changedAt.slice(0, 10))}</span> ·{' '}
              <span className="amount">{formatBRL(h.oldAmountCents)}</span> →{' '}
              <span className="amount font-semibold">{formatBRL(h.newAmountCents)}</span>
            </p>
          ))}
        </Card>
      )}
    </>
  );
}
