import Link from 'next/link';
import { salvarOrcamentoAction } from '@/app/_actions/planejamento';
import { statusOrcamento } from '@/core/budgets/domain';
import { addMeses, competenciaDe } from '@/core/shared/competencia';
import { getContainer } from '@/composition/container';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, competenciaDoParam, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, PageHeader } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, MoneyInput } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';
import { ProgressBar } from '@/ui/primitives/progress';

export const metadata = { title: 'Orçamento' };

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const c = await getContainer();
  const mes = competenciaDoParam(sp.mes, competenciaDe(c.clock.hoje()));
  // base (carteiras/categorias) e gasto por categoria em paralelo
  const [{ categories }, gastos] = await Promise.all([carregarBase(), c.categories.spendByCategory(mes)]);
  const gasto = new Map(gastos.map((g) => [g.categoryId, g.spentCents]));
  const comLimite = categories.filter((x) => x.monthlyBudgetCents);
  const totalLimite = comLimite.reduce((s, x) => s + (x.monthlyBudgetCents ?? 0), 0);
  const totalGasto = comLimite.reduce((s, x) => s + (gasto.get(x.id) ?? 0), 0);
  const geral = statusOrcamento(totalLimite || null, totalGasto);

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Orçamento" subtitle={rotuloCompetencia(mes)} />
      <div className="mb-3 flex items-center justify-between text-sm">
        <Link
          href={`/orcamento?mes=${addMeses(mes, -1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-link"
        >
          <Icon name="back" size={18} />
          Mês anterior
        </Link>
        <Link
          href={`/orcamento?mes=${addMeses(mes, 1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-link"
        >
          Próximo mês
          <Icon name="chevron" size={18} />
        </Link>
      </div>
      <Card className="mb-4 space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Gasto nas categorias com limite</p>
            <AmountDisplay cents={totalGasto} size="lg" />
          </div>
          <p className="text-sm text-muted">
            de <span className="amount">{centavosParaCampo(totalLimite)}</span>
          </p>
        </div>
        {totalLimite > 0 && (
          <ProgressBar
            pct={geral.usadoPct}
            tom={geral.estado === 'ok' ? 'ok' : 'alert'}
            label="Orçamento total usado"
          />
        )}
        {totalLimite === 0 && (
          <p className="text-sm text-muted">Defina limites mensais por categoria abaixo.</p>
        )}
      </Card>
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {categories.map((cat) => {
          const g = gasto.get(cat.id) ?? 0;
          const s = statusOrcamento(cat.monthlyBudgetCents, g);
          return (
            <Card key={cat.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{cat.name}</p>
                {s.estado === 'estourado' ? (
                  <Chip tom="danger">
                    <Icon name="alert" size={12} />
                    Estourado
                  </Chip>
                ) : s.estado === 'alerta' ? (
                  <Chip tom="alert">
                    <Icon name="alert" size={12} />
                    {s.usadoPct}% usado
                  </Chip>
                ) : s.estado === 'ok' ? (
                  <Chip tom="ok">{s.usadoPct}% usado</Chip>
                ) : (
                  <Chip>Sem limite</Chip>
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between text-sm">
                <AmountDisplay cents={g} size="sm" />
                {cat.monthlyBudgetCents ? (
                  <span className="text-muted">
                    restam{' '}
                    <span className="amount">
                      {centavosParaCampo(Math.max(0, s.restanteCents))}
                    </span>
                  </span>
                ) : null}
              </div>
              {cat.monthlyBudgetCents ? (
                <div className="mt-2">
                  <ProgressBar
                    pct={s.usadoPct}
                    tom={s.estado === 'ok' ? 'ok' : 'alert'}
                    label={`${cat.name} usado`}
                  />
                </div>
              ) : null}
              <details className="mt-1">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-link">
                  {cat.monthlyBudgetCents ? 'Alterar limite' : 'Definir limite'}
                </summary>
                <ActionForm
                  action={salvarOrcamentoAction}
                  submitLabel="Salvar limite"
                  className="space-y-3 pb-1"
                >
                  <input type="hidden" name="id" value={cat.id} />
                  <Field label="Limite mensal" hint="Deixe em branco para remover o limite.">
                    <MoneyInput
                      name="limit"
                      defaultValue={
                        cat.monthlyBudgetCents ? centavosParaCampo(cat.monthlyBudgetCents) : ''
                      }
                    />
                  </Field>
                </ActionForm>
              </details>
            </Card>
          );
        })}
      </div>
    </>
  );
}
