import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { proximoCredito, resumirBeneficio } from '@/core/benefits/domain';
import { statusOrcamento } from '@/core/budgets/domain';
import { estadoViagem, resumirViagem } from '@/core/trips/domain';
import { competenciaDe, diffDias } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { centavosParaCampo } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState, ProgressBar } from '@/ui/primitives/progress';
import { linkVer } from './link-ver';

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

export async function BlocoViagens() {
  const c = await getContainer();
  const hoje = c.clock.hoje();
  const ativas = (await c.trips.list()).filter((v) => estadoViagem(v, hoje) === 'andamento');
  if (ativas.length === 0) return null;
  const itens = await Promise.all(
    ativas.map(async (v) => {
      const l = await c.transactions.list({ tripId: v.id, limite: 500 });
      return { v, r: resumirViagem(v, l.filter((t) => t.kind === 'expense').map((t) => ({ categoryId: t.categoryId, cents: t.amountCents })), hoje) };
    }),
  );
  return (
    <>
      <SectionTitle action={linkVer('/mais/viagens')}>Viagens</SectionTitle>
      <div className="space-y-3">
        {itens.map(({ v, r }) => (
          <Link key={v.id} href={`/mais/viagens/${v.id}`} className="block">
            <Card className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{v.name}</p><p className="text-xs text-muted">{r.diasTotal === null ? `Dia ${r.diaAtual}` : `Dia ${r.diaAtual} de ${r.diasTotal}`}</p></div>
                {r.usadoPct !== null && <Chip tom={r.estourou ? 'danger' : 'info'}>{r.usadoPct}% do orçamento</Chip>}
              </div>
              {r.usadoPct !== null && <ProgressBar pct={Math.min(100, r.usadoPct)} tom={r.estourou ? 'alert' : 'ok'} label={`${v.name}: orçamento usado`} />}
              <div className="flex justify-between text-sm">
                <AmountDisplay cents={r.totalCents} size="sm" />
                <span className="text-muted">{v.budgetCents > 0 ? `de ${centavosParaCampo(v.budgetCents)}` : 'sem orçamento'}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
