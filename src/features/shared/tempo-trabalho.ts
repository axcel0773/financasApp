import 'server-only';
import type { getContainer } from '@/composition/container';
import { seloTempoDeTrabalho } from '@/core/calculadoras/horas';
import { calcularDescontoVr, estimarHolerite } from '@/core/income/holerite';
import { ehBeneficio, type WalletKind } from '@/core/wallets/domain';

type Container = Awaited<ReturnType<typeof getContainer>>;

/** Líquido mensal estimado do salário ativo (com o desconto de VR); 0 sem salário ou sem tabelas. */
export async function liquidoMensalEstimado(c: Container): Promise<number> {
  const [tabelas, fontes] = await Promise.all([c.income.tabelas(), c.income.fontes()]);
  const fonte = fontes.find((f) => f.active && f.kind === 'salary') ?? fontes.find((f) => f.kind === 'salary');
  if (!tabelas || !fonte || fonte.grossCents <= 0) return 0;
  return estimarHolerite({
    grossCents: fonte.grossCents,
    descontoVrCents: calcularDescontoVr(fonte.grossCents, fonte.vrDiscountPercent),
    inss: tabelas.inss,
    irrf: tabelas.irrf,
    paramsIrrf: tabelas.paramsIrrf,
  }).netCents;
}

/**
 * Função que devolve o selo "custou X de trabalho" de um lançamento, ou undefined quando não se aplica
 * (entrada, VR/VA, jornada 0 em Ajustes ou sem salário cadastrado).
 */
export async function carregarSeloTempo(
  c: Container,
  wallets: { id: string; kind: WalletKind }[],
): Promise<(t: { cents: number; kind: 'expense' | 'income'; walletId: string }) => string | undefined> {
  const [liquidoMensalCents, ajustes] = await Promise.all([liquidoMensalEstimado(c), c.settings.get()]);
  const tipo = new Map(wallets.map((w) => [w.id, w.kind]));
  return (t) => {
    const k = tipo.get(t.walletId);
    return (
      seloTempoDeTrabalho({
        cents: t.cents,
        kind: t.kind,
        beneficio: k ? ehBeneficio(k) : false,
        liquidoMensalCents,
        horasSemanais: ajustes.workHoursWeek,
      }) ?? undefined
    );
  };
}
