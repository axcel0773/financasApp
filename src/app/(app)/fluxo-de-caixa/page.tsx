import { rotuloRecebimento } from '@/features/renda/receipt-row';
import { agruparFaturas } from '@/core/card-invoices/domain';
import { projetarSaldo, type EventoCaixa } from '@/core/cashflow/domain';
import { ocorrenciasPendentes } from '@/core/recurring/domain';
import { addDias, addMeses, competenciaDe, type Competencia } from '@/core/shared/competencia';
import { carregarBase } from '@/features/base';
import { dataCurta } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { StepLine } from '@/ui/charts/step-line';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip, FilterChip } from '@/ui/primitives/chip';
import { Icon } from '@/ui/primitives/icon';
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

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais' }}
        title="Fluxo de caixa"
        subtitle={`Próximos ${dias} dias · conta e dinheiro`}
      />
      <div className="mb-4 flex gap-2">
        {[30, 60, 90].map((d) => (
          <FilterChip key={d} href={`/fluxo-de-caixa?dias=${d}`} ativo={d === dias}>
            {d} dias
          </FilterChip>
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Saldo hoje</p>
                <AmountDisplay cents={saldoAtual} size="lg" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Em {dias} dias</p>
                <AmountDisplay
                  cents={proj.pontos[proj.pontos.length - 1]?.saldoCents ?? saldoAtual}
                  size="lg"
                />
              </div>
            </div>
            <div className="mt-3">
              <StepLine
                titulo="Saldo projetado"
                minimo={ajustes.minBalanceCents}
                pontos={proj.pontos.map((p) => ({ label: dataCurta(p.date), value: p.saldoCents }))}
              />
            </div>
          </Card>
          <Card className={`mt-3 ${proj.alerta ? 'bg-danger-bg' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Menor saldo do período</p>
                <AmountDisplay
                  cents={proj.menorSaldo.saldoCents}
                  size="md"
                  tom={proj.alerta ? 'expense' : 'default'}
                />
                <p className="text-xs text-muted">em {dataCurta(proj.menorSaldo.date)}</p>
              </div>
              {proj.alerta ? (
                <Chip tom="alert">
                  <Icon name="alert" size={12} />
                  Abaixo do mínimo
                </Chip>
              ) : (
                <Chip tom="ok">
                  <Icon name="check" size={12} />
                  Dentro do mínimo
                </Chip>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Mínimo configurado em Mais. Faturas já vencidas são consideradas pagas.
            </p>
          </Card>
        </div>
        <div>
          <SectionTitle>Entradas e saídas previstas</SectionTitle>
          {lista.length === 0 ? (
            <EmptyState title="Nada previsto neste período">
              Cadastre fixos, parcelas e recebimentos para projetar o saldo.
            </EmptyState>
          ) : (
            <Card className="py-1">
              {lista.map((e, i) => (
                <div
                  key={`${e.date}-${i}`}
                  className="flex min-h-12 items-center justify-between gap-3 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{e.label}</p>
                    <p className="text-xs text-muted">{dataCurta(e.date)}</p>
                  </div>
                  <AmountDisplay
                    cents={e.cents}
                    sinal
                    size="sm"
                    tom={e.cents < 0 ? 'expense' : 'income'}
                  />
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
