import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { proximoCredito, resumirBeneficio } from '@/core/benefits/domain';
import { calcularSobraDoMes, statusOrcamento } from '@/core/budgets/domain';
import { gerarAvisos } from '@/core/alerts/domain';
import { compararMeses } from '@/core/reports/domain';
import { Bars } from '@/ui/charts/bars';
import { totalRecebido } from '@/core/income/domain';
import { ocorrenciasPendentes } from '@/core/recurring/domain';
import {
  addDias,
  competenciaDe,
  diffDias,
  primeiroDia,
  ultimoDia,
} from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { rotuloRecebimento } from '@/features/renda/receipt-row';
import { centavosParaCampo, dataCurta, rotuloCompetencia } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, Hero, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState, ProgressBar } from '@/ui/primitives/progress';

const linkVer = (href: string, texto = 'Ver tudo') => (
  <Link
    href={href}
    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
  >
    {texto}
  </Link>
);

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
  return (
    <Hero>
      <p className="text-sm opacity-80">Sobra de {rotuloCompetencia(mes)}</p>
      <AmountDisplay cents={sobra} size="xl" tom="onDark" />
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-white/10 p-3">
          <p className="opacity-80">Recebido</p>
          <AmountDisplay cents={recebido} size="md" tom="onDark" />
        </div>
        <div className="rounded-md bg-white/10 p-3">
          <p className="opacity-80">Gasto (sem VR/VA)</p>
          <AmountDisplay cents={gasto} size="md" tom="onDark" />
        </div>
      </div>
    </Hero>
  );
}

export async function BlocoBeneficios() {
  const c = await getContainer();
  const hoje = c.clock.hoje();
  const [carteiras, saldos] = await Promise.all([c.wallets.list(), c.wallets.balances()]);
  const itens = await Promise.all(
    carteiras
      .filter((w) => ehBeneficio(w.kind))
      .map(async (w) => {
        const creditos = await c.benefits.credits(w.id);
        const ultimo = creditos[0];
        const saldo = saldos.find((s) => s.walletId === w.id)?.balanceCents ?? 0;
        if (!ultimo) return { w, saldo, resumo: null };
        const gastos = (
          await c.transactions.list({ walletId: w.id, de: ultimo.creditedOn, limite: 200 })
        )
          .filter((t) => t.kind === 'expense')
          .reduce((s, t) => s + t.amountCents, 0);
        return {
          w,
          saldo,
          resumo: resumirBeneficio({
            saldoCents: saldo,
            hoje,
            proximoCredito: proximoCredito(ultimo.creditedOn, hoje),
            gastoNoPeriodoCents: gastos,
            diasDecorridos: Math.max(1, diffDias(ultimo.creditedOn, hoje)),
          }),
        };
      }),
  );
  return (
    <>
      <SectionTitle action={linkVer('/beneficios', 'Detalhes')}>VR / VA</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {itens.map(({ w, saldo, resumo }) => (
          <Card key={w.id}>
            <p className="text-xs text-muted">{w.name}</p>
            <AmountDisplay cents={saldo} size="md" tom="default" />
            <p className="mt-1 text-xs text-muted">
              {resumo ? (
                <>
                  Por dia:{' '}
                  <span className="amount">{centavosParaCampo(resumo.disponivelPorDiaCents)}</span>
                </>
              ) : (
                'Sem crédito registrado'
              )}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}

export async function BlocoOrcamento() {
  const c = await getContainer();
  const mes = competenciaDe(c.clock.hoje());
  const [cats, gasto] = await Promise.all([c.categories.list(), c.categories.spendByCategory(mes)]);
  const g = new Map(gasto.map((x) => [x.categoryId, x.spentCents]));
  const linhas = cats
    .filter((x) => x.monthlyBudgetCents)
    .map((x) => ({
      x,
      s: statusOrcamento(x.monthlyBudgetCents, g.get(x.id) ?? 0),
      gasto: g.get(x.id) ?? 0,
    }))
    .sort((a, b) => b.s.usadoPct - a.s.usadoPct)
    .slice(0, 4);
  return (
    <>
      <SectionTitle action={linkVer('/orcamento')}>Orçamento</SectionTitle>
      {linhas.length === 0 ? (
        <EmptyState title="Nenhum limite definido">
          Defina limites por categoria em Orçamento.
        </EmptyState>
      ) : (
        <Card className="space-y-4">
          {linhas.map(({ x, s, gasto }) => (
            <div key={x.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{x.name}</span>
                {s.estado === 'ok' ? (
                  <Chip tom="ok">{s.usadoPct}%</Chip>
                ) : (
                  <Chip tom="alert">
                    <Icon name="alert" size={12} />
                    {s.estado === 'estourado' ? 'Estourado' : `${s.usadoPct}% — atenção`}
                  </Chip>
                )}
              </div>
              <ProgressBar
                pct={s.usadoPct}
                tom={s.estado === 'ok' ? 'ok' : 'alert'}
                label={`${x.name} usado`}
              />
              <p className="text-xs text-muted">
                <span className="amount">{centavosParaCampo(gasto)}</span> de{' '}
                <span className="amount">{centavosParaCampo(x.monthlyBudgetCents ?? 0)}</span>
              </p>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export async function BlocoRecebimentos() {
  const c = await getContainer();
  const hoje = c.clock.hoje(),
    mes = competenciaDe(hoje);
  const receb = (await c.income.recebimentos(mes, competenciaDe(addDias(hoje, 45))))
    .filter((r) => r.receivedOn === null)
    .sort((a, b) => (a.expectedOn ?? '').localeCompare(b.expectedOn ?? ''))
    .slice(0, 3);
  return (
    <>
      <SectionTitle action={linkVer('/renda')}>Próximos recebimentos</SectionTitle>
      {receb.length === 0 ? (
        <EmptyState title="Nenhum recebimento previsto">Cadastre o salário em Renda.</EmptyState>
      ) : (
        <Card className="py-1">
          {receb.map((r) => (
            <div
              key={r.id}
              className="flex min-h-14 items-center justify-between border-b border-border last:border-0"
            >
              <div>
                <p className="font-semibold">{rotuloRecebimento(r.kind)}</p>
                <p className="text-xs text-muted">
                  {r.expectedOn ? dataCurta(r.expectedOn) : 'sem data'}
                </p>
              </div>
              <AmountDisplay cents={r.expectedNetCents ?? 0} size="md" tom="income" />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export async function BlocoContas() {
  const c = await getContainer();
  const hoje = c.clock.hoje(),
    ate = addDias(hoje, 14);
  const regras = await c.recurring.regras();
  const comps = [...new Set([competenciaDe(hoje), competenciaDe(ate)])];
  const out = [];
  for (const comp of comps)
    out.push(
      ...ocorrenciasPendentes(regras, comp, await c.recurring.chavesGeradas(comp)).filter(
        (o) => o.date >= hoje && o.date <= ate,
      ),
    );
  out.sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <SectionTitle action={linkVer('/fixos')}>Próximas contas</SectionTitle>
      {out.length === 0 ? (
        <EmptyState title="Nenhuma conta nos próximos 14 dias" />
      ) : (
        <Card className="py-1">
          {out.slice(0, 4).map((o) => (
            <div
              key={`${o.ruleId}${o.date}`}
              className="flex min-h-14 items-center justify-between border-b border-border last:border-0"
            >
              <div>
                <p className="font-semibold">{o.name}</p>
                <p className="text-xs text-muted">{dataCurta(o.date)}</p>
              </div>
              <AmountDisplay cents={-o.amountCents} sinal size="sm" tom="expense" />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export async function BlocoRecentes() {
  const c = await getContainer();
  const [lista, wallets, cats] = await Promise.all([
    c.transactions.list({ limite: 5 }),
    c.wallets.list(),
    c.categories.list(),
  ]);
  return (
    <>
      <SectionTitle action={linkVer('/gastos')}>Últimos lançamentos</SectionTitle>
      {lista.length === 0 ? (
        <EmptyState title="Nenhum lançamento ainda">
          Toque em “+” para registrar o primeiro gasto.
        </EmptyState>
      ) : (
        <Card className="px-4 py-1">
          {lista.map((t) => {
            const cat = cats.find((x) => x.id === t.categoryId);
            return (
              <TransactionRow
                key={t.id}
                t={{
                  id: t.id,
                  href: `/gastos/${t.id}`,
                  descricao: t.note ?? cat?.name ?? 'Lançamento',
                  categoria: cat ? { nome: cat.name, cor: cat.color ?? '#667085' } : null,
                  carteira: wallets.find((w) => w.id === t.walletId)?.name ?? '',
                  data: dataCurta(t.occurredOn),
                  cents: t.amountCents,
                  kind: t.kind,
                }}
              />
            );
          })}
        </Card>
      )}
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
  const contas = [];
  for (const comp of comps)
    contas.push(
      ...ocorrenciasPendentes(regras, comp, await c.recurring.chavesGeradas(comp))
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

export async function BlocoTendencia() {
  const c = await getContainer();
  const meses = await c.queries.somaMensal(6);
  if (meses.length === 0) return null;
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
