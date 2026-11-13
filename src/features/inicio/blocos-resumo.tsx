import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { proximoCredito } from '@/core/benefits/domain';
import { calcularSobraDoMes, statusOrcamento } from '@/core/budgets/domain';
import { gerarAvisos } from '@/core/alerts/domain';
import { compararMeses } from '@/core/reports/domain';
import { Bars } from '@/ui/charts/bars';
import { totalRecebido } from '@/core/income/domain';
import { ocorrenciasPendentes } from '@/core/recurring/domain';
import { addDias, addMeses, competenciaDe, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { centavosParaCampo, rotuloCompetencia } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, Hero, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { linkVer } from './link-ver';

export async function BlocoHero() {
  const c = await getContainer();
  const hoje = c.clock.hoje(),
    mes = competenciaDe(hoje);
  const [receb, detalhe] = await Promise.all([
    c.income.recebimentos(mes, mes),
    c.queries.detalhado(primeiroDia(mes), ultimoDia(mes)),
  ]);
  const recebido =
    totalRecebido(receb) +
    detalhe.filter((d) => d.kind === 'income').reduce((s, d) => s + d.cents, 0);
  const gastos = detalhe
    .filter((d) => d.kind === 'expense')
    .map((d) => ({ walletKind: d.walletKind, cents: d.cents }));
  const sobra = calcularSobraDoMes(recebido, gastos);
  const gasto = gastos.filter((g) => !ehBeneficio(g.walletKind)).reduce((s, g) => s + g.cents, 0);
  // Desktop: evolução diária da sobra no mês (recebido acumulado menos gasto acumulado, sem VR/VA).
  const diaAtual = Number(hoje.slice(8, 10));
  const porDia = new Array<number>(diaAtual + 1).fill(0);
  const dia = (iso: string) => Math.min(diaAtual, Math.max(1, Number(iso.slice(8, 10))));
  for (const r of receb)
    if (r.receivedOn && r.netCents) porDia[dia(r.receivedOn)]! += r.netCents;
  for (const d of detalhe) {
    if (d.kind === 'income') porDia[dia(d.occurredOn)]! += d.cents;
    else if (!ehBeneficio(d.walletKind)) porDia[dia(d.occurredOn)]! -= d.cents;
  }
  let acc = 0;
  const serie = porDia.slice(1).map((v) => (acc += v));
  const lo = Math.min(0, ...serie);
  const hi = Math.max(1, ...serie);
  const pts = serie.map((v, i) => `${serie.length === 1 ? 0 : (i * 460) / (serie.length - 1)},${72 - ((v - lo) / (hi - lo)) * 64}`);
  return (
    <Hero>
      <p className="text-sm text-white/75">Sobra de {rotuloCompetencia(mes)}</p>
      <AmountDisplay cents={sobra} size="xl" tom="onDark" />
      {serie.length > 1 && (
        <svg
          viewBox="0 0 460 80"
          role="img"
          aria-label={`Evolução da sobra do mês, dia 1 a ${diaAtual}`}
          className="mt-4 hidden h-20 w-full lg:block"
          preserveAspectRatio="none"
        >
          <polyline points={`${pts.join(' ')} 460,80 0,80`} fill="white" fillOpacity="0.12" stroke="none" />
          <polyline points={pts.join(' ')} fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
        <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
          <p className="text-white/75">Recebido</p>
          <AmountDisplay cents={recebido} size="md" tom="onDark" />
        </div>
        <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
          <p className="text-white/75">Gasto (sem VR/VA)</p>
          <AmountDisplay cents={gasto} size="md" tom="onDark" />
        </div>
      </div>
    </Hero>
  );
}

export async function BlocoGastosMes() {
  const c = await getContainer();
  const mes = competenciaDe(c.clock.hoje());
  const detalhe = await c.queries.detalhado(primeiroDia(mes), ultimoDia(mes));
  const gastos = detalhe.filter((d) => d.kind === 'expense' && !ehBeneficio(d.walletKind));
  const viagens = gastos.filter((d) => d.tripId).reduce((s, d) => s + d.cents, 0);
  const diaADia = gastos.filter((d) => !d.tripId).reduce((s, d) => s + d.cents, 0);
  const total = diaADia + viagens;
  if (viagens === 0) return null;
  const pctViagem = total > 0 ? Math.round((viagens / total) * 100) : 0;
  return (
    <>
      <SectionTitle>Gastos do mês</SectionTitle>
      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Total (sem VR/VA)</span>
          <AmountDisplay cents={total} size="md" tom="expense" />
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-border" aria-hidden>
          <div className="bg-ink" style={{ width: `${100 - pctViagem}%` }} />
          <div className="bg-trip" style={{ width: `${pctViagem}%` }} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-ink" />Dia a dia</span>
          <span className="amount font-semibold">{centavosParaCampo(diaADia)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-trip" />Viagens</span>
          <span className="amount font-semibold">{centavosParaCampo(viagens)}</span>
        </div>
        <p className="text-xs text-muted">Os orçamentos por categoria consideram só o dia a dia.</p>
      </Card>
    </>
  );
}

export async function BlocoTendencia() {
  const c = await getContainer();
  const reais = await c.queries.somaMensal(6);
  if (reais.length === 0) return null;
  const fim = reais[reais.length - 1]!.competencia;
  const porMes = new Map(reais.map((m) => [m.competencia, m]));
  const meses = [-5, -4, -3, -2, -1, 0].map((d) => {
    const comp = addMeses(fim, d);
    return porMes.get(comp) ?? { competencia: comp, receivedCents: 0, spentCents: 0, benefitSpentCents: 0, leftoverCents: 0 };
  });
  const atual = meses[meses.length - 1]!;
  const anterior = meses[meses.length - 2];
  const cmp = anterior ? compararMeses(atual.spentCents, anterior.spentCents) : null;
  return (
    <>
      <SectionTitle action={linkVer('/relatorios', 'Relatórios')}>Gastos nos últimos meses</SectionTitle>
      <Card>
        <Bars
          titulo="Gastos por mês"
          barras={meses.map((m, i) => ({ label: rotuloCompetencia(m.competencia).slice(0, 3), value: m.spentCents, destaque: i === meses.length - 1 }))}
        />
        {cmp && cmp.deltaPct !== null && (
          <p className="mt-2 text-sm text-muted">
            {cmp.deltaCents > 0 ? 'Você gastou ' : 'Você gastou '}
            <span className="font-semibold">{Math.abs(Math.round(cmp.deltaPct))}% {cmp.deltaCents > 0 ? 'a mais' : 'a menos'}</span> que no mês anterior
            {' '}(<span className="amount">{centavosParaCampo(Math.abs(cmp.deltaCents))}</span>).
          </p>
        )}
      </Card>
    </>
  );
}

const TOM_AVISO = { perigo: 'danger', alerta: 'alert', info: 'info' } as const;

export async function BlocoAvisos() {
  const c = await getContainer();
  const hoje = c.clock.hoje();
  const mes = competenciaDe(hoje);
  const [cats, gasto, carteiras, regras, tabelas] = await Promise.all([
    c.categories.list(),
    c.categories.spendByCategory(mes),
    c.wallets.list(),
    c.recurring.regras(),
    c.income.tabelas(),
  ]);
  const g = new Map(gasto.map((x) => [x.categoryId, x.spentCents]));
  const orcamentos = cats
    .filter((x) => x.monthlyBudgetCents)
    .map((x) => {
      const s = statusOrcamento(x.monthlyBudgetCents, g.get(x.id) ?? 0);
      return { nome: x.name, usadoPct: s.usadoPct, estado: s.estado };
    });
  const beneficios = await Promise.all(
    carteiras
      .filter((w) => ehBeneficio(w.kind))
      .map(async (w) => {
        const ultimo = (await c.benefits.credits(w.id))[0];
        return { nome: w.name, proximoCredito: ultimo ? proximoCredito(ultimo.creditedOn, hoje) : null };
      }),
  );
  const ate = addDias(hoje, 3);
  const comps = [...new Set([mes, competenciaDe(ate)])];
  const ja = await Promise.all(comps.map((comp) => c.recurring.chavesGeradas(comp)));
  const contas = comps.flatMap((comp, i) =>
    ocorrenciasPendentes(regras, comp, ja[i]!)
      .filter((o) => o.date >= hoje && o.date <= ate)
      .map((o) => ({ nome: o.name, date: o.date, amountCents: o.amountCents })),
  );
  const avisos = gerarAvisos({
    hoje,
    beneficios,
    orcamentos,
    contas,
    validadeTabela: tabelas ? tabelas.validaDesde.inss : null,
    saldoAbaixoDoMinimo: null,
  });
  if (avisos.length === 0) return null;
  return (
    <>
      <SectionTitle>Avisos</SectionTitle>
      <Card className="py-1">
        {avisos.slice(0, 5).map((a) => (
          <Link key={a.id} href={a.href} className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 last:border-0">
            <span className="min-w-0">
              <span className="block font-semibold">{a.titulo}</span>
              <span className="block text-xs text-muted">{a.detalhe}</span>
            </span>
            <Chip tom={TOM_AVISO[a.tom]}>{a.tom === 'perigo' ? 'Urgente' : a.tom === 'alerta' ? 'Atenção' : 'Aviso'}</Chip>
          </Link>
        ))}
      </Card>
    </>
  );
}
