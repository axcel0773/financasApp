import { randomUUID } from 'node:crypto';
import { criarTransferenciaAction, excluirTransferenciaAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { dataCurta } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';

export const metadata = { title: 'Transferir' };

export default async function TransferirPage() {
  const { c, wallets, hoje } = await carregarBase();
  const lista = (await c.transfers.list(20)).filter((t) => !t.deletedAt);
  const nome = new Map(wallets.map((w) => [w.id, w.name]));
  const opcoes = wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>);
  return (
    <>
      <PageHeader voltar={{ href: '/gastos' }} title="Transferir" subtitle="Mover dinheiro entre carteiras, ou pagar a fatura" />
      <Card>
        <ActionForm action={criarTransferenciaAction} submitLabel="Transferir">
          <input type="hidden" name="clientId" value={randomUUID()} />
          <Field label="De"><Select name="from" defaultValue={wallets[0]?.id}>{opcoes}</Select></Field>
          <Field label="Para"><Select name="to" defaultValue={wallets[1]?.id ?? wallets[0]?.id}>{opcoes}</Select></Field>
          <Field label="Valor"><MoneyInput name="amount" required /></Field>
          <Field label="Data"><Input type="date" name="occurredOn" defaultValue={hoje} required /></Field>
          <Field label="Observação (opcional)"><Input name="note" maxLength={200} /></Field>
        </ActionForm>
      </Card>
      <SectionTitle>Recentes</SectionTitle>
      <Card className="space-y-3">
        {lista.length === 0 && <p className="text-sm text-muted">Nenhuma transferência.</p>}
        {lista.map((t) => (
          <div key={t.id} className="border-b border-border pb-2 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">{nome.get(t.fromWalletId) ?? '—'} → {nome.get(t.toWalletId) ?? '—'}</p>
              <AmountDisplay cents={t.amountCents} size="sm" />
            </div>
            <p className="text-xs text-muted">{dataCurta(t.occurredOn)}{t.note ? ` · ${t.note}` : ''}</p>
            <ExcluirConfirmado action={excluirTransferenciaAction} id={t.id} aviso="Os saldos das duas carteiras voltam ao que eram antes." />
          </div>
        ))}
      </Card>
    </>
  );
}
