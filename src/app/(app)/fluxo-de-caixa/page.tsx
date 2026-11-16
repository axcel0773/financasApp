import { rotuloRecebimento } from '@/features/renda/receipt-row';
import { agruparFaturas } from '@/core/card-invoices/domain';
import { projetarSaldo, type EventoCaixa } from '@/core/cashflow/domain';
import { ocorrenciasPendentes } from '@/core/recurring/domain';
import { addDias, addMeses, competenciaDe, type Competencia } from '@/core/shared/competencia';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, dataCurta, diaDaSemana } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { StepLine } from '@/ui/charts/step-line';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Linha } from '@/ui/patterns/row';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { LinhaDoTempo } from '@/ui/patterns/timeline';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';
import { FilterChip } from '@/ui/primitives/chip';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'Fluxo de caixa' };

export default async function FluxoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dias = [30, 60, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const { c, wallets, hoje, mesAtual } = await carregarBase();
  const ate = addDias(hoje, dias);
  const comps: Competencia[] = [];
  for (let m = mesAtual; m <= competenciaDe(ate); m = addMeses(m, 1)) comps.push(m);

  const cartoes = wallets.filter((x) => x.kind === 'credit_card' && x.closingDay && x.dueDay);
  const [saldos, ajustes, receb, regras, futuros, jaPorComp, comprasPorCartao] = await Promise.all([
    c.wallets.balances(),
    c.settings.get(),
    c.income.recebimentos(mesAtual, competenciaDe(ate)),
    c.recurring.regras(),
    c.queries.detalhado(addDias(hoje, 1), ate),
    Promise.all(comps.map((comp) => c.recurring.chavesGeradas(comp))),
    Promise.all(
      cartoes.map((w) => c.transactions.list({ walletId: w.id, de: `${addMeses(mesAtual, -2)}-01`, limite: 500 })),
    ),
  ]);
  const caixa = (k: string) => k === 'checking' || k === 'cash';
  const kindDe = new Map(wallets.map((w) => [w.id, w.kind]));
  const saldoAtual = saldos.filter((b) => caixa(b.kind)).reduce((s, b) => s + b.balanceCents, 0);

  const eventos: EventoCaixa[] = [];
  for (const r of receb)
    if (r.receivedOn === null && r.expectedOn && r.expectedNetCents)
      eventos.push({
        date: r.expectedOn,
        cents: r.expectedNetCents,
        label: rotuloRecebimento(r.kind),
      });
  for (const [i, comp] of comps.entries()) {
    const ja = jaPorComp[i]!;
    for (const o of ocorrenciasPendentes(regras, comp, ja))
      if (caixa(kindDe.get(o.walletId) ?? ''))
        eventos.push({ date: o.date, cents: -o.amountCents, label: o.name });
  }
  for (const f of futuros)
    if (caixa(f.walletKind))
      eventos.push({
        date: f.occurredOn,
        cents: f.kind === 'expense' ? -f.cents : f.cents,
        label: f.kind === 'expense' ? 'Gasto agendado' : 'Entrada agendada',
      });
  for (const [i, w] of cartoes.entries()) {
    const compras = comprasPorCartao[i]!
      .filter((t) => t.kind === 'expense')
      .map((t) => ({ id: t.id, date: t.occurredOn, amountCents: t.amountCents }));
    for (const f of agruparFaturas(compras, w.closingDay!, w.dueDay!))
      if (f.venceEm >= hoje && f.venceEm <= ate)
        eventos.push({ date: f.venceEm, cents: -f.totalCents, label: `Fatura ${w.name}` });
  }

  const proj = projetarSaldo(saldoAtual, hoje, ate, eventos, ajustes.minBalanceCents);
  const lista = eventos
    .filter((e) => e.date >= hoje && e.date <= ate)
    .sort((a, b) => a.date.localeCompare(b.date));

  const final = proj.pontos[proj.pontos.length - 1]?.saldoCents ?? saldoAtual;
  const entradas = lista.filter((e) => e.cents > 0).reduce((t, e) => t + e.cents, 0);
  const saidas = lista.filter((e) => e.cents < 0).reduce((t, e) => t - e.cents, 0);
  const proxima = lista.find((e) => e.cents < 0);
  const saldoNoDia = new Map(proj.pontos.map((p) => [p.date, p.saldoCents]));
  const porDia = new Map<string, typeof lista>();
  for (const e of lista) porDia.set(e.date, [...(porDia.get(e.date) ?? []), e]);
  const icone = (e: EventoCaixa) =>
    e.cents > 0 ? (
      <IconeRedondo nome="wallet" tom="entrada" />
    ) : e.label.startsWith('Fatura') ? (
      <IconeRedondo nome="card" />
    ) : e.label.startsWith('Gasto agendado') ? (
      <IconeRedondo nome="list" />
    ) : (
      <IconeRedondo nome="repeat" />
    );

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais' }}
        title="Fluxo de caixa"
        subtitle="Conta corrente e dinheiro"
      />
      <div className="mb-4 flex gap-2">
        {[30, 60, 90].map((d) => (
          <FilterChip key={d} href={`/fluxo-de-caixa?dias=${d}`} ativo={d === dias}>
            {d} dias
          </FilterChip>
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6">
        <div className="space-y-3">
          <Hero>
            <p className="text-sm text-white/75">Saldo previsto em {dias} dias</p>
            <AmountDisplay cents={final} tom="onDark" size="xl" />
            <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
              <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                <p className="text-white/75">Saldo hoje</p>
                <AmountDisplay cents={saldoAtual} size="md" tom="onDark" />
              </div>
              <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                <p className="text-white/75">Variação</p>
                <AmountDisplay cents={final - saldoAtual} size="md" tom="onDark" sinal />
              </div>
            </div>
          </Hero>
          <Card>
            <h2 className="mb-2 font-display text-base font-semibold">Saldo dia a dia</h2>
            <StepLine
              titulo="Saldo projetado"
              minimo={ajustes.minBalanceCents}
              pontos={proj.pontos.map((p) => ({ label: dataCurta(p.date), value: p.saldoCents }))}
            />
          </Card>
          <GradeWidgets colunas={2}>
            <Widget
              rotulo="Menor saldo"
              valor={<AmountDisplay cents={proj.menorSaldo.saldoCents} size="md" tom={proj.alerta ? 'expense' : 'default'} />}
              contexto={`${dataCurta(proj.menorSaldo.date)} · ${proj.alerta ? 'abaixo do mínimo' : 'dentro do mínimo'}`}
              visual={<IconeRedondo nome={proj.alerta ? 'alert' : 'check'} tom={proj.alerta ? 'saida' : 'entrada'} />}
            />
            <Widget
              rotulo="Próxima saída"
              valor={proxima ? <AmountDisplay cents={-proxima.cents} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto={proxima ? `${proxima.label} · ${dataCurta(proxima.date)}` : 'Nada previsto'}
              visual={<IconeRedondo nome="calendar" />}
            />
            <Widget
              rotulo="Entradas previstas"
              valor={<AmountDisplay cents={entradas} size="md" tom="income" />}
              contexto={`${lista.filter((e) => e.cents > 0).length} no período`}
              visual={<IconeRedondo nome="wallet" tom="entrada" />}
            />
            <Widget
              rotulo="Saídas previstas"
              valor={<AmountDisplay cents={saidas} size="md" />}
              contexto={`${lista.filter((e) => e.cents < 0).length} no período`}
              visual={<IconeRedondo nome="repeat" tom="saida" />}
            />
          </GradeWidgets>
          <p className="text-xs text-muted">
            Mínimo configurado em Mais → Ajustes. Faturas já vencidas são consideradas pagas.
          </p>
        </div>
        <div>
          <SectionTitle>Dia a dia</SectionTitle>
          {lista.length === 0 ? (
            <EmptyState title="Nada previsto neste período">
              Cadastre fixos, parcelas e recebimentos para projetar o saldo.
            </EmptyState>
          ) : (
            <LinhaDoTempo
              grupos={[...porDia.entries()].map(([d, evs]) => ({
                chave: d,
                titulo: d === hoje ? 'Hoje' : diaDaSemana(d),
                direita: saldoNoDia.has(d) ? (
                  <>
                    saldo <span className="amount font-semibold text-ink">{centavosParaCampo(saldoNoDia.get(d)!)}</span>
                  </>
                ) : undefined,
                itens: evs.map((e, i) => (
                  <Linha
                    key={`${d}-${i}`}
                    icone={icone(e)}
                    titulo={e.label}
                    direita={<AmountDisplay cents={e.cents} sinal size="sm" tom={e.cents < 0 ? 'expense' : 'income'} />}
                  />
                )),
              }))}
            />
          )}
        </div>
      </div>
    </>
  );
}
