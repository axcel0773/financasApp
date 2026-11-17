import 'server-only';
import { addMeses, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { mediaGastoMensal } from '@/core/goals/domain';
import { calcularDescontoVr, estimarHolerite } from '@/core/income/holerite';
import { ehBeneficio } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';

/**
 * Seus dados que as calculadoras usam como ponto de partida (tudo continua editável na tela, e nada é salvo):
 * salário e desconto de VR, último crédito de VR e de VA, tabelas de INSS/IRRF, gasto médio dos últimos 3 meses e reserva.
 */
export async function carregarDadosCalculadoras() {
  const { c, wallets, hoje, mesAtual } = await carregarBase();
  const meses = [addMeses(mesAtual, -3), addMeses(mesAtual, -2), addMeses(mesAtual, -1)];
  const [tabelas, fontes, creditos, metas, det, ajustes] = await Promise.all([
    c.income.tabelas(),
    c.income.fontes(),
    c.benefits.credits(),
    c.goals.list(),
    c.queries.detalhado(primeiroDia(meses[0]!), ultimoDia(meses[2]!)),
    c.settings.get(),
  ]);
  const fonte = fontes.find((f) => f.active && f.kind === 'salary') ?? fontes.find((f) => f.kind === 'salary');
  const tipo = new Map(wallets.map((w) => [w.id, w.kind]));
  const ultimoCredito = (k: 'meal_voucher' | 'food_voucher') =>
    creditos
      .filter((x) => tipo.get(x.walletId) === k)
      .sort((a, b) => b.creditedOn.localeCompare(a.creditedOn))[0]?.amountCents ?? 0;
  const porMes = meses.map((m) =>
    det
      .filter((d) => d.kind === 'expense' && !ehBeneficio(d.walletKind) && d.occurredOn >= primeiroDia(m) && d.occurredOn <= ultimoDia(m))
      .reduce((s, d) => s + d.cents, 0),
  );
  const t = tabelas ? { inss: tabelas.inss, irrf: tabelas.irrf, paramsIrrf: tabelas.paramsIrrf } : null;
  const brutoCents = fonte?.grossCents ?? 0;
  const descontoVrPercent = fonte?.vrDiscountPercent ?? 0;
  const liquidoMensalCents =
    t && brutoCents > 0
      ? estimarHolerite({ grossCents: brutoCents, descontoVrCents: calcularDescontoVr(brutoCents, descontoVrPercent), ...t }).netCents
      : 0;
  return {
    hoje,
    tabelas: t,
    brutoCents,
    descontoVrPercent,
    liquidoMensalCents,
    vrMensalCents: ultimoCredito('meal_voucher'),
    vaMensalCents: ultimoCredito('food_voucher'),
    gastoMedioCents: mediaGastoMensal(porMes),
    reservaCents: metas.find((m) => m.kind === 'emergency')?.currentCents ?? 0,
    cdiPercent: ajustes.cdiPercent,
  };
}
export type DadosCalculadoras = Awaited<ReturnType<typeof carregarDadosCalculadoras>>;
