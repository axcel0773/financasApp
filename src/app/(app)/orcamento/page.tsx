import { salvarOrcamentoAction } from '@/app/_actions/planejamento';
import { statusOrcamento } from '@/core/budgets/domain';
import { addMeses, competenciaDe } from '@/core/shared/competencia';
import { getContainer } from '@/composition/container';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, competenciaDoParam, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, MoneyInput } from '@/ui/primitives/fields';
import { Ring } from '@/ui/charts/ring';
import { CategoryIcon } from '@/ui/patterns/category-icon';
import { Recolhivel } from '@/ui/patterns/collapsible';
import { MonthSwitch } from '@/ui/patterns/month-switch';
import { Linha, ListaCartao } from '@/ui/patterns/row';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';

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

  const status = (x: (typeof categories)[number]) => statusOrcamento(x.monthlyBudgetCents, gasto.get(x.id) ?? 0);
  const ordenadas = [...comLimite].sort((a, b) => status(b).usadoPct - status(a).usadoPct);
  const semLimite = categories.filter((x) => !x.monthlyBudgetCents);
  const contar = (e: string) => comLimite.filter((x) => status(x).estado === e).length;
  const formLimite = (cat: (typeof categories)[number]) => (
    <ActionForm action={salvarOrcamentoAction} submitLabel="Salvar limite" className="space-y-3">
      <input type="hidden" name="id" value={cat.id} />
      <Field label="Limite mensal" hint="Deixe em branco para remover o limite.">
        <MoneyInput name="limit" defaultValue={cat.monthlyBudgetCents ? centavosParaCampo(cat.monthlyBudgetCents) : ''} />
      </Field>
    </ActionForm>
  );

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Orçamento" subtitle="Limites mensais por categoria" />
      <MonthSwitch
        anterior={`/orcamento?mes=${addMeses(mes, -1)}`}
        proximo={`/orcamento?mes=${addMeses(mes, 1)}`}
        rotulo={rotuloCompetencia(mes)}
      />
      <div className="space-y-3">
        <Hero>
          <p className="text-sm text-white/75">Gasto nas categorias com limite</p>
          <AmountDisplay cents={totalGasto} tom="onDark" size="xl" />
          {totalLimite > 0 ? (
            <>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
                <div
                  className={geral.estado === 'estourado' ? 'h-full rounded-full bg-expense' : 'h-full rounded-full bg-accent'}
                  style={{ width: `${Math.min(100, geral.usadoPct)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-white/75">
                {geral.usadoPct}% de <span className="amount">{centavosParaCampo(totalLimite)}</span> ·{' '}
                {geral.restanteCents >= 0 ? (
                  <>restam <span className="amount">{centavosParaCampo(geral.restanteCents)}</span></>
                ) : (
                  <>passou <span className="amount">{centavosParaCampo(-geral.restanteCents)}</span></>
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/75">Defina limites mensais nas categorias abaixo.</p>
          )}
        </Hero>
        <GradeWidgets>
          <Widget rotulo="Dentro do limite" valor={<span className="text-lg font-semibold">{contar('ok')}</span>} contexto="categorias" visual={<IconeRedondo nome="check" tom="entrada" />} />
          <Widget rotulo="Perto do limite" valor={<span className="text-lg font-semibold">{contar('alerta')}</span>} contexto="categorias" visual={<IconeRedondo nome="alert" />} />
          <Widget rotulo="Estouradas" valor={<span className="text-lg font-semibold">{contar('estourado')}</span>} contexto="categorias" visual={<IconeRedondo nome="alert" tom="saida" />} />
          <Widget rotulo="Sem limite" valor={<span className="text-lg font-semibold">{semLimite.length}</span>} contexto="categorias" visual={<IconeRedondo nome="tag" />} />
        </GradeWidgets>
      </div>

      {ordenadas.length > 0 && (
        <>
          <SectionTitle>Com limite</SectionTitle>
          <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
            {ordenadas.map((cat) => {
              const g = gasto.get(cat.id) ?? 0;
              const s = status(cat);
              return (
                <Card key={cat.id}>
                  <div className="flex items-center gap-3">
                    <CategoryIcon nome={cat.name} cor={cat.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{cat.name}</p>
                      <p className="text-xs text-muted">
                        <span className="amount">{centavosParaCampo(g)}</span> de{' '}
                        <span className="amount">{centavosParaCampo(cat.monthlyBudgetCents ?? 0)}</span>
                      </p>
                    </div>
                    <Ring
                      pct={s.usadoPct}
                      size={52}
                      alerta={s.estado !== 'ok'}
                      rotulo={`${s.usadoPct}%`}
                      descricao={`${cat.name}: ${s.usadoPct}% do limite usado`}
                    />
                  </div>
                  <p className={s.estado === 'estourado' ? 'mt-2 text-sm font-semibold text-expense-text' : 'mt-2 text-sm text-muted'}>
                    {s.restanteCents >= 0 ? (
                      <>restam <span className="amount">{centavosParaCampo(s.restanteCents)}</span></>
                    ) : (
                      <>passou <span className="amount">{centavosParaCampo(-s.restanteCents)}</span></>
                    )}
                  </p>
                  <Recolhivel titulo="Alterar limite" className="mt-2 border-0 bg-transparent px-0">
                    {formLimite(cat)}
                  </Recolhivel>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {semLimite.length > 0 && (
        <>
          <SectionTitle>Sem limite</SectionTitle>
          <ListaCartao>
            {semLimite.map((cat) => (
              <div key={cat.id} className="border-b border-border last:border-0">
                <Linha
                  className="border-0"
                  icone={<CategoryIcon nome={cat.name} cor={cat.color} />}
                  titulo={cat.name}
                  contexto={
                    <>
                      gasto no mês <span className="amount">{centavosParaCampo(gasto.get(cat.id) ?? 0)}</span>
                    </>
                  }
                />
                <Recolhivel titulo="Definir limite" className="mb-2 border-0 bg-transparent px-0">
                  {formLimite(cat)}
                </Recolhivel>
              </div>
            ))}
          </ListaCartao>
        </>
      )}
    </>
  );
}
