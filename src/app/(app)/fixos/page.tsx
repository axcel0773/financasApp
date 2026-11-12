import {
  criarParcelamentoAction,
  gerarFixosAction,
  salvarRegraAction,
} from '@/app/_actions/planejamento';
import { excluirParcelamentoAction, excluirRegraFixaAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { centavosParaCampo, dataCurta, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, Select, Switch } from '@/ui/primitives/fields';
import { EmptyState, ProgressBar } from '@/ui/primitives/progress';

export const metadata = { title: 'Fixos e parcelas' };

export default async function FixosPage() {
  const { c, wallets, categories, hoje, mesAtual } = await carregarBase();
  const [regras, planos, todas] = await Promise.all([
    c.recurring.regras(),
    c.recurring.planos(),
    c.transactions.list({ limite: 1000 }),
  ]);
  const pagas = (id: string) =>
    todas.filter((t) => t.installmentPlanId === id && t.occurredOn <= hoje).length;
  const opcoesCarteira = wallets.map((w) => (
    <option key={w.id} value={w.id}>
      {w.name}
    </option>
  ));
  const opcoesCategoria = (
    <>
      <option value="">Sem categoria</option>
      {categories.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
        </option>
      ))}
    </>
  );
  const totalFixos = regras.filter((r) => r.active).reduce((s, r) => s + r.amountCents, 0);

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais' }}
        title="Fixos e parcelas"
        subtitle="Gastos que se repetem e compras parceladas"
      />
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <Card className="mb-3">
            <p className="text-sm text-muted">Total de fixos ativos por mês</p>
            <AmountDisplay cents={totalFixos} size="lg" tom="expense" />
          </Card>
          <ActionForm
            action={gerarFixosAction}
            submitLabel={`Gerar fixos de ${rotuloCompetencia(mesAtual)}`}
            variante="secondary"
          >
            <input type="hidden" name="competencia" value={mesAtual} />
          </ActionForm>
          <p className="mt-1 text-xs text-muted">Pode clicar mais de uma vez: nada é duplicado.</p>
          <SectionTitle>Gastos fixos</SectionTitle>
          {regras.length === 0 ? (
            <EmptyState title="Nenhum gasto fixo">
              Cadastre aluguel, internet, assinaturas…
            </EmptyState>
          ) : (
            <Card className="py-1">
              {regras.map((r) => (
                <details key={r.id} className="border-b border-border last:border-0">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3">
                    <span>
                      <span className="block font-semibold">{r.name}</span>
                      <span className="text-xs text-muted">
                        todo dia {r.dayOfMonth}
                        {r.active ? '' : ' · pausado'}
                      </span>
                    </span>
                    <AmountDisplay cents={r.amountCents} size="sm" />
                  </summary>
                  <ActionForm
                    action={salvarRegraAction}
                    submitLabel="Salvar fixo"
                    className="space-y-3 pb-3"
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <Field label="Nome">
                      <Input name="name" defaultValue={r.name} required maxLength={80} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Valor">
                        <MoneyInput
                          name="amount"
                          defaultValue={centavosParaCampo(r.amountCents)}
                          required
                        />
                      </Field>
                      <Field label="Dia do mês">
                        <Input
                          name="dayOfMonth"
                          inputMode="numeric"
                          defaultValue={r.dayOfMonth}
                          required
                        />
                      </Field>
                    </div>
                    <Field label="Carteira">
                      <Select name="walletId" defaultValue={r.walletId}>
                        {opcoesCarteira}
                      </Select>
                    </Field>
                    <Field label="Categoria">
                      <Select name="categoryId" defaultValue={r.categoryId ?? ''}>
                        {opcoesCategoria}
                      </Select>
                    </Field>
                    <Field label="Começa em">
                      <Input type="date" name="startOn" defaultValue={r.startOn} required />
                    </Field>
                    <Switch name="active" defaultChecked={r.active} label="Ativo (desmarque para pausar)" />
                  </ActionForm>
                  <ExcluirConfirmado action={excluirRegraFixaAction} id={r.id} aviso="Encerra este fixo. Lançamentos já gerados continuam no histórico." />
                </details>
              ))}
            </Card>
          )}
          <details className="mt-3 rounded-lg border border-border bg-surface p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link">
              Novo gasto fixo
            </summary>
            <ActionForm
              action={salvarRegraAction}
              submitLabel="Cadastrar fixo"
              className="mt-3 space-y-3"
            >
              <Field label="Nome">
                <Input name="name" required maxLength={80} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor">
                  <MoneyInput name="amount" required />
                </Field>
                <Field label="Dia do mês">
                  <Input name="dayOfMonth" inputMode="numeric" required />
                </Field>
              </div>
              <Field label="Carteira">
                <Select name="walletId">{opcoesCarteira}</Select>
              </Field>
              <Field label="Categoria">
                <Select name="categoryId">{opcoesCategoria}</Select>
              </Field>
              <Field label="Começa em">
                <Input type="date" name="startOn" defaultValue={hoje} required />
              </Field>
            </ActionForm>
          </details>
        </div>
        <div>
          <SectionTitle>Compras parceladas</SectionTitle>
          {planos.length === 0 ? (
            <EmptyState title="Nenhuma compra parcelada" />
          ) : (
            <div className="space-y-3">
              {planos.map((p) => {
                const n = pagas(p.id);
                return (
                  <Card key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{p.description}</p>
                      <Chip>
                        {n}/{p.installments}
                      </Chip>
                    </div>
                    <div className="flex justify-between text-sm text-muted">
                      <span>
                        Total <span className="amount">{centavosParaCampo(p.totalCents)}</span>
                      </span>
                      <span>1ª parcela em {dataCurta(p.firstOn)}</span>
                    </div>
                    <ProgressBar
                      pct={(n / p.installments) * 100}
                      label={`${p.description}: parcelas pagas`}
                    />
                    <ExcluirConfirmado action={excluirParcelamentoAction} id={p.id} aviso="Remove o parcelamento e as parcelas futuras ainda não vencidas. As já pagas ficam no histórico." />
                  </Card>
                );
              })}
            </div>
          )}
          <details className="mt-3 rounded-lg border border-border bg-surface p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link">
              Nova compra parcelada
            </summary>
            <ActionForm
              action={criarParcelamentoAction}
              submitLabel="Criar parcelas"
              className="mt-3 space-y-3"
            >
              <Field label="Descrição">
                <Input name="description" required maxLength={80} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor total">
                  <MoneyInput name="total" required />
                </Field>
                <Field label="Nº de parcelas">
                  <Input name="installments" inputMode="numeric" required placeholder="10" />
                </Field>
              </div>
              <Field label="Data da 1ª parcela">
                <Input type="date" name="firstOn" defaultValue={hoje} required />
              </Field>
              <Field label="Carteira">
                <Select name="walletId">{opcoesCarteira}</Select>
              </Field>
              <Field label="Categoria">
                <Select name="categoryId">{opcoesCategoria}</Select>
              </Field>
              <p className="text-xs text-muted">
                O total é dividido em centavos: o resto vai para a 1ª parcela, sem perder nem criar
                centavo.
              </p>
            </ActionForm>
          </details>
        </div>
      </div>
    </>
  );
}
