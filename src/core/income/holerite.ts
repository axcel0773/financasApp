import type { Cents } from '../shared/money';

export interface Faixa {
  upToCents: Cents | null;
  rate: number;
  deductionCents: Cents;
}
export interface ParamsIrrf {
  dependentCents: Cents;
  simplifiedCents: Cents;
  reducer?: { exemptUntilCents: Cents; phaseUntilCents: Cents; aCents: Cents; b: number };
}
export interface Holerite {
  grossCents: Cents;
  inssCents: Cents;
  irrfCents: Cents;
  netCents: Cents;
}

/** INSS progressivo: cada alíquota incide só na parte do salário dentro da faixa; arredonda por faixa. */
export function calcularInss(grossCents: Cents, faixas: Faixa[]): Cents {
  let anterior = 0;
  let total = 0;
  for (const f of faixas) {
    const teto = f.upToCents ?? Number.POSITIVE_INFINITY;
    const parte = Math.min(grossCents, teto) - anterior;
    if (parte > 0) total += Math.round(parte * f.rate);
    anterior = teto;
    if (grossCents <= teto) break;
  }
  return total;
}

/**
 * IRRF mensal: base = menor entre (bruto − INSS − dependentes) e (bruto − desconto simplificado).
 * Depois aplica a faixa (alíquota × base − parcela a deduzir) e o redutor da Lei 15.270/2025, se houver.
 */
export function calcularIrrf(p: {
  grossCents: Cents;
  inssCents: Cents;
  dependentes: number;
  faixas: Faixa[];
  params: ParamsIrrf;
}): Cents {
  const legal = p.grossCents - p.inssCents - p.dependentes * p.params.dependentCents;
  const base = Math.max(0, Math.min(legal, p.grossCents - p.params.simplifiedCents));
  const faixa = p.faixas.find((f) => f.upToCents === null || base <= f.upToCents);
  let imposto = faixa ? Math.max(0, Math.round(base * faixa.rate) - faixa.deductionCents) : 0;
  const r = p.params.reducer;
  if (r) {
    if (p.grossCents <= r.exemptUntilCents) imposto = 0;
    else if (p.grossCents < r.phaseUntilCents)
      imposto = Math.max(0, imposto - Math.max(0, Math.round(r.aCents - r.b * p.grossCents)));
  }
  return imposto;
}

export function estimarHolerite(p: {
  grossCents: Cents;
  dependentes?: number;
  inss: Faixa[];
  irrf: Faixa[];
  paramsIrrf: ParamsIrrf;
}): Holerite {
  const inssCents = calcularInss(p.grossCents, p.inss);
  const irrfCents = calcularIrrf({
    grossCents: p.grossCents,
    inssCents,
    dependentes: p.dependentes ?? 0,
    faixas: p.irrf,
    params: p.paramsIrrf,
  });
  return {
    grossCents: p.grossCents,
    inssCents,
    irrfCents,
    netCents: p.grossCents - inssCents - irrfCents,
  };
}

/** Adiantamento = % do bruto, sem descontos; o pagamento final recebe todos os descontos. */
export function dividirSalario(
  h: Holerite,
  adiantamentoPercent: number,
): { adiantamentoCents: Cents; finalCents: Cents } {
  const adiantamentoCents = Math.round((h.grossCents * adiantamentoPercent) / 100);
  return { adiantamentoCents, finalCents: h.netCents - adiantamentoCents };
}
