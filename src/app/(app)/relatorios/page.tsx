import Link from 'next/link';
import { compararMeses, totaisPorCategoria } from '@/core/reports/domain';
import { addMeses, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { competenciaDoParam, rotuloCompetencia, rotuloMesCurto } from '@/ui/format';
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
  const [detalhe, resumo] = await Promise.all([
    c.queries.detalhado(primeiroDia(mes), ultimoDia(mes)),
    c.queries.somaMensal(6),
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
          className="inline-flex min-h-11 items-center gap-1 text-primary"
        >
          <Icon name="back" size={18} />
          Mês anterior
        </Link>
        <Link
          href={`/relatorios?mes=${addMeses(mes, 1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-primary"
        >
          Próximo mês
          <Icon name="chevron" size={18} />
        </Link>
      </div>
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
