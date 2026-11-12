import { esvaziarLixeiraAction } from '@/app/_actions/gastos';
import { DIAS_LIXEIRA } from '@/core/shared/constants';
import { carregarBase } from '@/features/base';
import { RestaurarButton } from '@/features/gastos/acoes-gasto';
import { dataCurta } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { ActionForm } from '@/ui/patterns/action-form';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Input, Field } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/primitives/progress';
import { Icon } from '@/ui/primitives/icon';

export const metadata = { title: 'Lixeira' };

export default async function LixeiraPage() {
  const { c } = await carregarBase();
  const itens = await c.transactions.list({ apenasLixeira: true, limite: 100 });
  return (
    <>
      <PageHeader
        title="Lixeira"
        subtitle={`Itens são apagados de vez após ${DIAS_LIXEIRA} dias.`}
        back={
          <ButtonLink href="/gastos" variant="ghost" className="-ml-4">
            <Icon name="back" size={18} />
            Gastos
          </ButtonLink>
        }
      />
      {itens.length === 0 ? (
        <EmptyState title="A lixeira está vazia" />
      ) : (
        <Card className="divide-y divide-border p-0">
          {itens.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.note ?? 'Lançamento'}</p>
                <p className="text-xs text-muted">{dataCurta(t.occurredOn)}</p>
              </div>
              <AmountDisplay cents={t.amountCents} size="sm" />
              <RestaurarButton id={t.id} />
            </div>
          ))}
        </Card>
      )}
      {itens.length > 0 && (
        <>
          <SectionTitle>Apagar definitivamente</SectionTitle>
          <ActionForm
            action={esvaziarLixeiraAction}
            submitLabel="Esvaziar lixeira"
            variante="danger"
          >
            <Field label="Confirme com sua senha" hint="Esta ação não pode ser desfeita.">
              <Input type="password" name="senha" autoComplete="current-password" required />
            </Field>
          </ActionForm>
        </>
      )}
    </>
  );
}
