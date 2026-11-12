import Link from 'next/link';
import { compararMeses, totaisPorCategoria } from '@/core/reports/domain';
import { gerarInsights } from '@/core/reports/insights';
import { addMeses, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { competenciaDe } from '@/core/shared/competencia';
import { centavosParaCampo, competenciaDoParam, rotuloCompetencia, rotuloMesCurto } from '@/ui/format';
import { Bars } from '@/ui/charts/bars';
import { Donut } from '@/ui/charts/donut';
import { AmountDisplay } from '@/ui/patterns/amount-display';
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

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Relatórios" subtitle={rotuloCompetencia(mes)} />
      <div className="mb-3 flex items-center justify-between text-sm">
        <Link
          href={`/relatorios?mes=${addMeses(mes, -1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-link"
        >
          <Icon name="back" size={18} />
          Mês anterior
        </Link>
        <Link
          href={`/relatorios?mes=${addMeses(mes, 1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-link"
        >
          Próximo mês
          <Icon name="chevron" size={18} />
        </Link>
      </div>
      <SectionTitle>Diagnóstico do mês</SectionTitle>
      <Card className="mb-3 space-y-3 text-sm">
        {insights.projecao && (
          <p>
            <span className="font-semibold">Projeção:</span> no ritmo atual ({brl(insights.projecao.gastoAteHojeCents)} em{' '}
            {insights.projecao.diasDecorridos} dias) você fecha o mês com cerca de{' '}
            <span className="amount font-semibold">{brl(insights.projecao.projecaoCents)}</span> em gastos.
          </p>
        )}
        {insights.emAlta.length > 0 && (
          <div>
            <p className="font-semibold">Em alta frente à média dos meses anteriores</p>
            <ul className="mt-1 space-y-1">
              {insights.emAlta.map((a) => (
                <li key={a.nome} className="text-muted">
                  {a.nome}: {brl(a.atualCents)} (média {brl(a.mediaCents)}, <span className="font-semibold text-expense-text">+{a.deltaPct.toFixed(0)}%</span>)
                </li>
              ))}
            </ul>
          </div>
        )}
        {insights.maiores.length > 0 && (
          <div>
            <p className="font-semibold">Onde mais pesa</p>
            <ul className="mt-1 space-y-1 text-muted">
              {insights.maiores.map((m) => (
                <li key={m.nome}>{m.nome}: {brl(m.cents)} ({m.pct.toFixed(0)}% dos gastos)</li>
              ))}
            </ul>
          </div>
        )}
        {insights.economias.length > 0 && (
          <div>
            <p className="font-semibold">Quanto cortar economizaria</p>
            <ul className="mt-1 space-y-1 text-muted">
              {insights.economias.map((e) => (
                <li key={e.nome}>
                  {e.nome}: −10% poupa {brl(e.mensal10Cents)}/mês; −20% poupa {brl(e.mensal20Cents)}/mês ({brl(e.anual20Cents)} por ano).
                </li>
              ))}
            </ul>
          </div>
        )}
        {insights.fixosPctRenda !== null && (
          <p>
            <span className="font-semibold">Fixos:</span> consomem {insights.fixosPctRenda.toFixed(0)}% da renda do mês.
            {insights.fixosPctRenda > 50 && ' É bastante; rever assinaturas e contratos costuma render mais que cortar gastos pequenos.'}
          </p>
        )}
        {!insights.projecao && insights.maiores.length === 0 && (
          <p className="text-muted">Registre gastos neste mês para ver o diagnóstico.</p>
        )}
        {insights.mesesDeHistorico === 0 && insights.maiores.length > 0 && (
          <p className="text-xs text-muted">Sem meses anteriores com gastos, ainda não dá para comparar com a sua média.</p>
        )}
        <p className="text-xs text-muted">Cálculo simples com os seus dados, feito no próprio app. A projeção assume gasto constante ao longo do mês. Gastos de viagem ficam de fora.</p>
      </Card>
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <SectionTitle>Gasto por categoria</SectionTitle>
          <Card>
            {fatias.length === 0 ? (
              <EmptyState title="Sem gastos neste mês" />
            ) : (
              <Donut
                titulo="Gasto por categoria"
                fatias={fatias.map((f) => ({ label: f.name, value: f.cents, color: f.color }))}
              />
            )}
          </Card>
        </div>
        <div>
          <SectionTitle>Comparação mensal</SectionTitle>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Gasto do mês (sem VR/VA)</p>
                <AmountDisplay cents={gastoMes} size="lg" tom="expense" />
              </div>
              {cmp.deltaPct === null ? (
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
              )}
            </div>
            <Bars titulo="Gasto nos últimos meses" barras={bars} />
            <p className="text-xs text-muted">
              Valores em reais por mês. O mês selecionado fica destacado.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
