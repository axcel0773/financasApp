import { compararMeses, totaisPorCategoria } from '@/core/reports/domain';
import { gerarInsights } from '@/core/reports/insights';
import { addMeses, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { competenciaDe } from '@/core/shared/competencia';
import { centavosParaCampo, competenciaDoParam, rotuloCompetencia, rotuloMesCurto } from '@/ui/format';
import { Bars } from '@/ui/charts/bars';
import { Ring } from '@/ui/charts/ring';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { CategoryBreakdown } from '@/ui/patterns/category-breakdown';
import { CategoryIcon } from '@/ui/patterns/category-icon';
import { MonthSwitch } from '@/ui/patterns/month-switch';
import { Widget } from '@/ui/patterns/widget';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'Relatórios' };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { c, categories, mesAtual } = await carregarBase();
  const mes = competenciaDoParam(sp.mes, mesAtual);
  const [detalhe, resumo, historico, regras, hoje] = await Promise.all([
    c.queries.detalhado(primeiroDia(mes), ultimoDia(mes)),
    c.queries.somaMensal(6),
    c.queries.detalhado(primeiroDia(addMeses(mes, -3)), ultimoDia(addMeses(mes, -1))),
    c.recurring.regras(),
    Promise.resolve(c.clock.hoje()),
  ]);
  const despesas = detalhe.filter((d) => d.kind === 'expense');
  const fatias = totaisPorCategoria(
    despesas.map((d) => ({ categoryId: d.categoryId, cents: d.cents })),
    categories.map((x) => ({ id: x.id, name: x.name, color: x.color })),
  );
  const gastoMes = despesas
    .filter((d) => !ehBeneficio(d.walletKind))
    .reduce((s, d) => s + d.cents, 0);
  const anterior = resumo.find((r) => r.competencia === addMeses(mes, -1))?.spentCents ?? 0;
  const cmp = compararMeses(gastoMes, anterior);
  const semBeneficio = (d: { kind: string; tripId: string | null; walletKind: Parameters<typeof ehBeneficio>[0] }) =>
    d.kind === 'expense' && !d.tripId && !ehBeneficio(d.walletKind);
  const insights = gerarInsights({
    hoje,
    mes,
    atual: detalhe.filter(semBeneficio).map((d) => ({ categoryId: d.categoryId, cents: d.cents })),
    anteriores: historico
      .filter(semBeneficio)
      .map((d) => ({ categoryId: d.categoryId, cents: d.cents, competencia: competenciaDe(d.occurredOn) })),
    categorias: categories.map((x) => ({ id: x.id, name: x.name })),
    fixosCents: regras.filter((r) => r.active).reduce((s, r) => s + r.amountCents, 0),
    rendaCents: resumo.find((r) => r.competencia === mes)?.receivedCents || null,
  });
  const brl = (n: number) => `R$ ${centavosParaCampo(n)}`;
  const bars = resumo.map((r) => ({
    label: rotuloMesCurto(r.competencia),
    value: r.spentCents,
    destaque: r.competencia === mes,
  }));

  const maior = fatias[0];
  const delta =
    cmp.deltaPct === null ? (
      <Chip>Sem mês anterior</Chip>
    ) : cmp.deltaCents > 0 ? (
      <Chip tom="alert">
        <Icon name="alert" size={12} />+{cmp.deltaPct.toFixed(0)}% vs. anterior
      </Chip>
    ) : (
      <Chip tom="ok">
        <Icon name="check" size={12} />
        {cmp.deltaPct.toFixed(0)}% vs. anterior
      </Chip>
    );

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Relatórios" subtitle="Entenda para onde foi o dinheiro" />
      <MonthSwitch
        anterior={`/relatorios?mes=${addMeses(mes, -1)}`}
        proximo={`/relatorios?mes=${addMeses(mes, 1)}`}
        rotulo={rotuloCompetencia(mes)}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Widget
          rotulo="Gasto do mês"
          valor={<AmountDisplay cents={gastoMes} size="md" />}
          contexto={cmp.deltaPct === null ? 'Sem mês anterior' : `${cmp.deltaCents > 0 ? '+' : ''}${cmp.deltaPct.toFixed(0)}% vs. mês anterior`}
          visual={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-soft text-link">
              <Icon name="chart" size={18} />
            </span>
          }
        />
        <Widget
          rotulo="Projeção do mês"
          valor={
            insights.projecao ? (
              <AmountDisplay cents={insights.projecao.projecaoCents} size="md" />
            ) : (
              <span className="text-lg font-semibold">—</span>
            )
          }
          contexto={
            insights.projecao
              ? `no ritmo de ${insights.projecao.diasDecorridos} ${insights.projecao.diasDecorridos === 1 ? 'dia' : 'dias'}`
              : 'Só no mês corrente'
          }
          visual={
            <Ring
              pct={insights.projecao ? (insights.projecao.diasDecorridos / insights.projecao.diasNoMes) * 100 : 0}
            />
          }
        />
        <Widget
          rotulo="Maior categoria"
          valor={<span className="text-lg font-semibold">{maior ? maior.name : '—'}</span>}
          contexto={maior ? `${brl(maior.cents)} · ${maior.pct.toFixed(0)}% do gasto` : 'Sem gastos neste mês'}
          visual={<CategoryIcon nome={maior?.name} cor={maior?.categoryId ? maior.color : null} />}
        />
        <Widget
          rotulo="Fixos na renda"
          valor={
            <span className="amount text-lg font-semibold">
              {insights.fixosPctRenda === null ? '—' : `${insights.fixosPctRenda.toFixed(0)}%`}
            </span>
          }
          contexto={insights.fixosPctRenda === null ? 'Sem renda no mês' : insights.fixosPctRenda > 50 ? 'É bastante' : 'Dentro do razoável'}
          visual={<Ring pct={insights.fixosPctRenda ?? 0} alerta={(insights.fixosPctRenda ?? 0) > 50} />}
        />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <SectionTitle>Gasto por categoria</SectionTitle>
          <Card>
            {fatias.length === 0 ? (
              <EmptyState title="Sem gastos neste mês" />
            ) : (
              <CategoryBreakdown
                titulo="Gasto por categoria"
                itens={fatias.map((f) => ({
                  id: f.categoryId,
                  nome: f.name,
                  cor: f.categoryId ? f.color : null,
                  cents: f.cents,
                  pct: f.pct,
                  href: f.categoryId ? `/gastos?mes=${mes}&categoria=${f.categoryId}` : undefined,
                }))}
              />
            )}
          </Card>
        </div>
        <div>
          <SectionTitle>Comparação mensal</SectionTitle>
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Gasto do mês (sem VR/VA)</p>
                <AmountDisplay cents={gastoMes} size="lg" />
              </div>
              {delta}
            </div>
            <Bars titulo="Gasto nos últimos meses" barras={bars} />
            <p className="text-xs text-muted">Valores em reais por mês. O mês selecionado fica destacado.</p>
          </Card>
        </div>
      </div>

      {insights.emAlta.length > 0 && (
        <>
          <SectionTitle>Em alta frente à sua média</SectionTitle>
          <Card className="py-1">
            {insights.emAlta.map((a) => (
              <div key={a.nome} className="flex min-h-14 items-center gap-3 border-b border-border py-1.5 last:border-0">
                <CategoryIcon nome={a.nome} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{a.nome}</span>
                  <span className="block text-xs text-muted">média {brl(a.mediaCents)}</span>
                </span>
                <span className="text-right">
                  <span className="amount block font-semibold">{brl(a.atualCents)}</span>
                  <span className="block text-xs font-semibold text-expense-text">+{a.deltaPct.toFixed(0)}%</span>
                </span>
              </div>
            ))}
          </Card>
        </>
      )}

      {insights.economias.length > 0 && (
        <>
          <SectionTitle>Quanto cortar economizaria</SectionTitle>
          <Card className="py-1">
            {insights.economias.map((e) => (
              <div key={e.nome} className="flex min-h-14 items-center gap-3 border-b border-border py-2 last:border-0">
                <CategoryIcon nome={e.nome} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.nome}</span>
                  <span className="block truncate text-xs text-muted">até {brl(e.anual20Cents)} por ano</span>
                </span>
                <span className="grid shrink-0 grid-cols-2 gap-x-4 text-right text-xs text-muted">
                  <span>−10%</span>
                  <span>−20%</span>
                  <span className="amount text-sm font-semibold text-income">{brl(e.mensal10Cents)}</span>
                  <span className="amount text-sm font-semibold text-income">{brl(e.mensal20Cents)}</span>
                </span>
              </div>
            ))}
            <p className="py-2 text-xs text-muted">Economia por mês em cada cenário.</p>
          </Card>
        </>
      )}

      <p className="mt-6 text-xs text-muted">
        {insights.mesesDeHistorico === 0 && insights.maiores.length > 0 && 'Sem meses anteriores com gastos, ainda não dá para comparar com a sua média. '}
        Cálculo simples com os seus dados, feito no próprio app. A projeção assume gasto constante ao longo do mês. Gastos de viagem ficam de fora do diagnóstico.
      </p>
    </>
  );
}
