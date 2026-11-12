import Link from 'next/link';
import {
  adicionarCreditoAction,
  editarCreditoAction,
  removerCreditoAction,
} from '@/app/_actions/beneficios';
import { proximoCredito, resumirBeneficio } from '@/core/benefits/domain';
import { diffDias } from '@/core/shared/competencia';
import { ehBeneficio, ROTULO_CARTEIRA } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, dataCurta } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'VR / VA' };

export default async function BeneficiosPage() {
  const { c, wallets, hoje } = await carregarBase();
  const carteiras = wallets.filter((w) => ehBeneficio(w.kind));
  const saldos = new Map((await c.wallets.balances()).map((b) => [b.walletId, b.balanceCents]));
  const blocos = await Promise.all(
    carteiras.map(async (w) => {
      const creditos = await c.benefits.credits(w.id);
      const ultimo = creditos[0];
      const gastos = await c.transactions.list({
        walletId: w.id,
        de: ultimo?.creditedOn,
        limite: 200,
      });
      const gastoPeriodo = gastos
        .filter((g) => g.kind === 'expense')
        .reduce((s, g) => s + g.amountCents, 0);
      const proximo = ultimo ? proximoCredito(ultimo.creditedOn, hoje) : null;
      const resumo =
        ultimo && proximo
          ? resumirBeneficio({
              saldoCents: saldos.get(w.id) ?? 0,
              hoje,
              proximoCredito: proximo,
              gastoNoPeriodoCents: gastoPeriodo,
              diasDecorridos: Math.max(1, diffDias(ultimo.creditedOn, hoje)),
            })
          : null;
      return { w, creditos, gastos, proximo, resumo, saldo: saldos.get(w.id) ?? 0 };
    }),
  );

  return (
    <>
      <PageHeader
        title="VR / VA"
        subtitle="Gastos pagos com VR/VA não entram na sobra do salário."
      />
      <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {blocos.map(({ w, creditos, gastos, proximo, resumo, saldo }) => (
          <section key={w.id} aria-label={w.name} className="space-y-3">
            <Card className="bg-primary-dark text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">{w.name}</p>
                  <AmountDisplay cents={saldo} size="xl" tom="onDark" />
                </div>
                <Chip tom="info">{ROTULO_CARTEIRA[w.kind]}</Chip>
              </div>
              {proximo && (
                <p className="mt-1 text-sm opacity-80">
                  Próximo crédito em {dataCurta(proximo)} · {resumo?.diasAteCredito} dia(s)
                </p>
              )}
            </Card>
            {resumo ? (
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <p className="text-xs text-muted">Disponível por dia</p>
                  <AmountDisplay cents={resumo.disponivelPorDiaCents} size="md" />
                </Card>
                <Card>
                  <p className="text-xs text-muted">Média diária de gasto</p>
                  <AmountDisplay cents={resumo.mediaDiariaCents} size="md" />
                </Card>
                <Card className="col-span-2">
                  <p className="text-xs text-muted">Sobra projetada até o próximo crédito</p>
                  <div className="flex items-center justify-between">
                    <AmountDisplay
                      cents={resumo.sobraProjetadaCents}
                      size="lg"
                      tom={resumo.sobraProjetadaCents < 0 ? 'expense' : 'income'}
                    />
                    {resumo.sobraProjetadaCents < 0 ? (
                      <Chip tom="alert">
                        <Icon name="alert" size={12} />
                        Vai faltar
                      </Chip>
                    ) : (
                      <Chip tom="ok">
                        <Icon name="check" size={12} />
                        No ritmo
                      </Chip>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <EmptyState title="Registre o primeiro crédito">
                Com o crédito do mês, calculamos quanto dá para gastar por dia.
              </EmptyState>
            )}

            <SectionTitle>Créditos</SectionTitle>
            <Card className="py-1">
              {creditos.length === 0 && (
                <p className="py-3 text-sm text-muted">Nenhum crédito registrado.</p>
              )}
              {creditos.slice(0, 6).map((cr) => (
                <details key={cr.id} className="border-b border-border last:border-0">
                  <summary className="flex min-h-12 cursor-pointer items-center justify-between">
                    <span>{dataCurta(cr.creditedOn)}</span>
                    <AmountDisplay cents={cr.amountCents} size="sm" tom="income" />
                  </summary>
                  <ActionForm
                    action={editarCreditoAction}
                    submitLabel="Salvar crédito"
                    className="space-y-3 pb-3"
                  >
                    <input type="hidden" name="id" value={cr.id} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Data">
                        <Input
                          type="date"
                          name="creditedOn"
                          defaultValue={cr.creditedOn}
                          required
                        />
                      </Field>
                      <Field label="Valor">
                        <MoneyInput
                          name="amount"
                          defaultValue={centavosParaCampo(cr.amountCents)}
                          required
                        />
                      </Field>
                    </div>
                  </ActionForm>
                  <ActionForm
                    action={removerCreditoAction}
                    submitLabel="Remover crédito"
                    variante="danger"
                    className="pb-3"
                  >
                    <input type="hidden" name="id" value={cr.id} />
                  </ActionForm>
                </details>
              ))}
            </Card>
            <details className="rounded-lg border border-border bg-surface p-4">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link">
                Registrar crédito
              </summary>
              <ActionForm
                action={adicionarCreditoAction}
                submitLabel="Registrar crédito"
                className="mt-3 space-y-3"
              >
                <input type="hidden" name="walletId" value={w.id} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data">
                    <Input type="date" name="creditedOn" defaultValue={hoje} required />
                  </Field>
                  <Field label="Valor">
                    <MoneyInput name="amount" required />
                  </Field>
                </div>
              </ActionForm>
            </details>

            <SectionTitle
              action={
                <Link
                  href={`/gastos?carteira=${w.id}`}
                  className="inline-flex min-h-11 items-center text-sm text-link"
                >
                  Ver todos
                </Link>
              }
            >
              Gastos neste ciclo
            </SectionTitle>
            {gastos.length === 0 ? (
              <p className="text-sm text-muted">Sem gastos neste ciclo.</p>
            ) : (
              <Card className="px-4 py-1">
                {gastos.slice(0, 8).map((t) => (
                  <TransactionRow
                    key={t.id}
                    t={{
                      id: t.id,
                      href: `/gastos/${t.id}`,
                      descricao: t.note ?? 'Lançamento',
                      categoria: null,
                      carteira: w.name,
                      data: dataCurta(t.occurredOn),
                      cents: t.amountCents,
                      kind: t.kind,
                    }}
                  />
                ))}
              </Card>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
