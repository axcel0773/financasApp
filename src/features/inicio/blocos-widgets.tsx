import { getContainer } from '@/composition/container';
import { agruparFaturas, competenciaDaFatura, usoDoLimite } from '@/core/card-invoices/domain';
import { addMeses, competenciaDe, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio, type WalletKind } from '@/core/wallets/domain';
import { Heatmap } from '@/ui/charts/heatmap';
import { Ring } from '@/ui/charts/ring';
import { rotuloCompetencia } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Widget } from '@/ui/patterns/widget';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Icon, type IconName } from '@/ui/primitives/icon';
import { linkVer } from './link-ver';

const ICONE_CARTEIRA: Record<WalletKind, IconName> = {
  checking: 'wallet',
  cash: 'wallet',
  credit_card: 'card',
  meal_voucher: 'ticket',
  food_voucher: 'ticket',
};
const COR_BOLHA = ['var(--accent)', 'var(--trip)', 'var(--expense)', 'var(--muted)'];
const COR_SEGMENTO = ['var(--chart)', 'var(--trip)', 'var(--expense)', 'var(--muted)'];

/** Grade de cartões-widget: saldo em contas, gastos do mês, fatura do cartão e investimentos. */
export async function BlocoWidgets() {
  const c = await getContainer();
  const hoje = c.clock.hoje();
  const mes = competenciaDe(hoje);
  const [carteiras, saldos, detalhe, cats, invs, invSaldos] = await Promise.all([
    c.wallets.list(),
    c.wallets.balances(),
    c.queries.detalhado(primeiroDia(mes), ultimoDia(mes)),
    c.categories.list(),
    c.investments.list(),
    c.investments.latestBalances(),
  ]);

  // Saldo em contas: conta corrente e dinheiro (VR/VA e cartão têm telas próprias)
  const contas = saldos.filter((s) => s.kind === 'checking' || s.kind === 'cash');
  const saldoContas = contas.reduce((t, s) => t + s.balanceCents, 0);

  // Gastos do mês por categoria (sem VR/VA)
  const gastos = detalhe.filter((d) => d.kind === 'expense' && !ehBeneficio(d.walletKind));
  const totalGasto = gastos.reduce((t, d) => t + d.cents, 0);
  const porCat = new Map<string, number>();
  for (const g of gastos) porCat.set(g.categoryId ?? '', (porCat.get(g.categoryId ?? '') ?? 0) + g.cents);
  const ordenadas = [...porCat.entries()].sort((a, b) => b[1] - a[1]);
  const topo = ordenadas.slice(0, 3);
  const resto = ordenadas.slice(3).reduce((t, [, v]) => t + v, 0);
  const segmentos = [...topo.map(([, v]) => v), ...(resto > 0 ? [resto] : [])];
  const nomeCat = new Map(cats.map((x) => [x.id, x.name]));
  const maiorCat = topo[0] ? (nomeCat.get(topo[0][0]) ?? 'Sem categoria') : null;

  // Fatura do cartão
  const cartao = carteiras.find((w) => w.kind === 'credit_card');
  let faturaAtual = 0;
  let emAberto = 0;
  if (cartao) {
    const compras = (
      await c.transactions.list({ walletId: cartao.id, de: `${addMeses(mes, -6)}-01`, limite: 1000 })
    ).filter((t) => t.kind === 'expense');
    const fecha = cartao.closingDay ?? 25;
    const faturas = agruparFaturas(
      compras.map((t) => ({ id: t.id, date: t.occurredOn, amountCents: t.amountCents })),
      fecha,
      cartao.dueDay ?? 5,
    );
    const atual = competenciaDaFatura(hoje, fecha);
    faturaAtual = faturas.find((f) => f.competencia === atual)?.totalCents ?? 0;
    emAberto = usoDoLimite(faturas, hoje, null).emAbertoCents;
  }
  const limite = cartao?.limitCents ?? null;
  const pctLimite = limite && limite > 0 ? Math.round((emAberto / limite) * 100) : null;

  // Investimentos
  const idsAtivos = new Set(invs.map((i) => i.id));
  const totalInv = invSaldos.filter((s) => idsAtivos.has(s.investmentId)).reduce((t, s) => t + s.balanceCents, 0);

  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <Widget
        href="/mais/carteiras"
        rotulo="Saldo em contas"
        valor={<AmountDisplay cents={saldoContas} size="md" />}
        contexto={`${contas.length} ${contas.length === 1 ? 'conta' : 'contas'}`}
        visual={
          <span className="flex">
            {carteiras.slice(0, 4).map((w, i) => (
              <span
                key={w.id}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-[#0a0a0b] ring-2 ring-surface first:ml-0"
                style={{ background: COR_BOLHA[i % COR_BOLHA.length] }}
              >
                <Icon name={ICONE_CARTEIRA[w.kind]} size={16} />
              </span>
            ))}
          </span>
        }
      />
      <Widget
        href="/gastos"
        rotulo={`Gastos · ${rotuloCompetencia(mes).split(' ')[0]}`}
        valor={<AmountDisplay cents={totalGasto} size="md" />}
        contexto={maiorCat ? `Mais em ${maiorCat}` : 'Nenhum gasto ainda'}
        visual={
          <span className="flex h-3 w-full gap-1" aria-hidden="true">
            {segmentos.length === 0 ? (
              <span className="h-full w-full rounded-full bg-soft" />
            ) : (
              segmentos.map((v, i) => (
                <span
                  key={i}
                  className="h-full rounded-full"
                  style={{ flexGrow: v, flexBasis: 0, minWidth: 6, background: COR_SEGMENTO[i % COR_SEGMENTO.length] }}
                />
              ))
            )}
          </span>
        }
      />
      <Widget
        href="/cartao"
        rotulo="Fatura do cartão"
        valor={<AmountDisplay cents={faturaAtual} size="md" />}
        contexto={
          !cartao ? 'Nenhum cartão cadastrado' : pctLimite === null ? 'Sem limite informado' : `${pctLimite}% do limite usado`
        }
        visual={<Ring pct={pctLimite ?? 0} alerta={(pctLimite ?? 0) >= 90} />}
      />
      <Widget
        href="/investimentos"
        rotulo="Investimentos"
        valor={<AmountDisplay cents={totalInv} size="md" />}
        contexto={`${invs.length} ${invs.length === 1 ? 'investimento' : 'investimentos'}`}
        visual={
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-soft text-link">
            <Icon name="trend" size={18} />
          </span>
        }
      />
    </div>
  );
}

/** Mapa de calor dos gastos por dia no mês corrente (sem VR/VA). */
export async function BlocoCalor() {
  const c = await getContainer();
  const hoje = c.clock.hoje();
  const mes = competenciaDe(hoje);
  const fim = ultimoDia(mes);
  const detalhe = await c.queries.detalhado(primeiroDia(mes), fim);
  const porDia = new Map<number, number>();
  let total = 0;
  for (const d of detalhe) {
    if (d.kind !== 'expense' || ehBeneficio(d.walletKind)) continue;
    const dia = Number(d.occurredOn.slice(8, 10));
    porDia.set(dia, (porDia.get(dia) ?? 0) + d.cents);
    total += d.cents;
  }
  const diaHoje = Number(hoje.slice(8, 10));
  const ultimo = Number(fim.slice(8, 10));
  const dias = Array.from({ length: ultimo }, (_, i) => ({
    dia: i + 1,
    cents: porDia.get(i + 1) ?? 0,
    futuro: i + 1 > diaHoje,
  }));
  const titulo = `Gastos por dia em ${rotuloCompetencia(mes)}`;
  return (
    <>
      <SectionTitle action={linkVer('/gastos', 'Ver gastos')}>Gastos por dia</SectionTitle>
      <Card className="space-y-4">
        <div>
          <p className="text-xs text-muted">Gastos em {rotuloCompetencia(mes)} (sem VR/VA)</p>
          <AmountDisplay cents={total} size="lg" />
        </div>
        <Heatmap dias={dias} titulo={titulo} />
      </Card>
    </>
  );
}
