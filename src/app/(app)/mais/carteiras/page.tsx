import Link from 'next/link';
import { arquivarCarteiraAction, criarCarteiraAction, renomearCarteiraAction } from '@/app/_actions/gestao';
import { ROTULO_CARTEIRA, type WalletKind } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { centavosParaCampo } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';

export const metadata = { title: 'Carteiras' };

export default async function CarteirasPage() {
  const { c, wallets } = await carregarBase();
  const [saldos, arquivadas] = await Promise.all([c.wallets.balances(), c.wallets.arquivadas()]);
  const saldo = new Map(saldos.map((s) => [s.walletId, s.balanceCents]));
  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Carteiras" subtitle="Contas, cartões, VR/VA e dinheiro" />
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {wallets.map((w) => (
          <Card key={w.id}>
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-semibold">{w.name}</p><Chip>{ROTULO_CARTEIRA[w.kind]}</Chip></div>
              <AmountDisplay cents={saldo.get(w.id) ?? 0} size="md" />
            </div>
            <details className="mt-1">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-link">Editar</summary>
              <ActionForm action={renomearCarteiraAction} submitLabel="Salvar" className="space-y-3 pb-1">
                <input type="hidden" name="id" value={w.id} />
                <Field label="Nome"><Input name="name" defaultValue={w.name} required maxLength={60} /></Field>
                <Field label="Saldo inicial" hint="Quanto havia na carteira antes de você começar a registrar."><MoneyInput name="opening" defaultValue={centavosParaCampo(w.openingCents)} /></Field>
              </ActionForm>
              {w.kind === 'credit_card' && <Link href="/cartao" className="inline-flex min-h-11 items-center text-sm font-semibold text-link">Fechamento, vencimento e limite</Link>}
            </details>
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-expense-text">Arquivar</summary>
              <ActionForm action={arquivarCarteiraAction} submitLabel="Confirmar: arquivar" variante="danger" className="space-y-3 pb-1">
                <input type="hidden" name="id" value={w.id} /><input type="hidden" name="arquivar" value="1" />
                <p className="text-sm text-muted">A carteira some das listas, mas o histórico fica. Dá para restaurar abaixo.</p>
              </ActionForm>
            </details>
          </Card>
        ))}
      </div>

      <SectionTitle>Nova carteira</SectionTitle>
      <Card>
        <ActionForm action={criarCarteiraAction} submitLabel="Criar carteira">
          <Field label="Nome"><Input name="name" required maxLength={60} placeholder="Nubank, Poupança…" /></Field>
          <Field label="Tipo"><Select name="kind" defaultValue="checking">{(Object.keys(ROTULO_CARTEIRA) as WalletKind[]).map((k) => <option key={k} value={k}>{ROTULO_CARTEIRA[k]}</option>)}</Select></Field>
          <Field label="Saldo inicial (opcional)"><MoneyInput name="opening" /></Field>
          <p className="text-xs text-muted">Só para cartão de crédito:</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Fecha dia"><Input name="closingDay" inputMode="numeric" /></Field>
            <Field label="Vence dia"><Input name="dueDay" inputMode="numeric" /></Field>
            <Field label="Limite"><MoneyInput name="limit" /></Field>
          </div>
        </ActionForm>
      </Card>

      {arquivadas.length > 0 && (<>
        <SectionTitle>Arquivadas</SectionTitle>
        <Card className="space-y-1">{arquivadas.map((w) => (
          <ActionForm key={w.id} action={arquivarCarteiraAction} submitLabel={`Restaurar ${w.name}`} className="space-y-0">
            <input type="hidden" name="id" value={w.id} /><input type="hidden" name="arquivar" value="0" />
          </ActionForm>
        ))}</Card>
      </>)}
    </>
  );
}
