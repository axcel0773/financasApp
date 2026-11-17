import type { Cents } from '../shared/money';

export interface EntradaCenario {
  /** Renda líquida de hoje, por mês. */
  rendaCents: Cents;
  /** Gasto médio de hoje, por mês. */
  gastoCents: Cents;
  reservaCents: Cents;
  /** Renda durante o cenário (ex.: 0 se perder o emprego, valor do seguro-desemprego). */
  rendaNoCenarioCents: Cents;
  /** Por quantos meses a renda fica diferente; depois volta à de hoje. null = para sempre. */
  duracaoMeses: number | null;
  /** Variação dos gastos no cenário, em % (−20 corta 20%). */
  variacaoGastoPct: number;
  /** Gasto novo por mês no cenário (uma parcela nova, por exemplo). */
  gastoExtraCents: Cents;
  /** Rendimento da reserva ao mês, em %. */
  rendimentoMensalPct: number;
  meses: number;
}

export interface MesCenario {
  mes: number;
  rendaCents: Cents;
  gastoCents: Cents;
  saldoReservaCents: Cents;
}

export interface ResultadoCenario {
  sobraHojeCents: Cents;
  sobraNoCenarioCents: Cents;
  linhas: MesCenario[];
  /** Primeiro mês em que a reserva fica negativa (null se aguenta o período todo). */
  mesQueAcaba: number | null;
  /** Meses que a reserva cobre o déficit do cenário (null se não há déficit). */
  coberturaMeses: number | null;
}

/** Simulador "e se": o que acontece com a reserva mês a mês se a renda ou os gastos mudarem. */
export function simularCenario(e: EntradaCenario): ResultadoCenario {
  const gastoCenario = Math.max(0, Math.round(e.gastoCents * (1 + e.variacaoGastoPct / 100)) + e.gastoExtraCents);
  const r = e.rendimentoMensalPct / 100;
  const linhas: MesCenario[] = [];
  let saldo = e.reservaCents;
  let mesQueAcaba: number | null = null;
  for (let m = 1; m <= Math.max(1, Math.min(120, e.meses)); m++) {
    const noCenario = e.duracaoMeses === null || m <= e.duracaoMeses;
    const renda = noCenario ? e.rendaNoCenarioCents : e.rendaCents;
    const gasto = noCenario ? gastoCenario : e.gastoCents;
    saldo = Math.round(saldo * (1 + (saldo > 0 ? r : 0))) + renda - gasto;
    if (saldo < 0 && mesQueAcaba === null) mesQueAcaba = m;
    linhas.push({ mes: m, rendaCents: renda, gastoCents: gasto, saldoReservaCents: saldo });
  }
  const sobraNoCenarioCents = e.rendaNoCenarioCents - gastoCenario;
  return {
    sobraHojeCents: e.rendaCents - e.gastoCents,
    sobraNoCenarioCents,
    linhas,
    mesQueAcaba,
    coberturaMeses: sobraNoCenarioCents < 0 ? Math.max(0, e.reservaCents) / -sobraNoCenarioCents : null,
  };
}
