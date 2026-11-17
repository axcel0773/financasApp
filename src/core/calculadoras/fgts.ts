import type { Cents } from '../shared/money';
import { FGTS_MULTA } from './parametros';
import { fgtsAnual } from './pacote';

/** Tabela do saque-aniversário (Lei 8.036/1990, art. 20-A): alíquota sobre o saldo + parcela adicional. */
const FAIXAS_ANIVERSARIO: { ateCents: Cents | null; aliquota: number; adicionalCents: Cents }[] = [
  { ateCents: 50_000, aliquota: 0.5, adicionalCents: 0 },
  { ateCents: 100_000, aliquota: 0.4, adicionalCents: 5_000 },
  { ateCents: 500_000, aliquota: 0.3, adicionalCents: 15_000 },
  { ateCents: 1_000_000, aliquota: 0.2, adicionalCents: 65_000 },
  { ateCents: 1_500_000, aliquota: 0.15, adicionalCents: 115_000 },
  { ateCents: 2_000_000, aliquota: 0.1, adicionalCents: 190_000 },
  { ateCents: null, aliquota: 0.05, adicionalCents: 290_000 },
];

/** Valor do saque-aniversário para um saldo total do FGTS. */
export function saqueAniversario(saldoCents: Cents): Cents {
  if (saldoCents <= 0) return 0;
  const f = FAIXAS_ANIVERSARIO.find((x) => x.ateCents === null || saldoCents <= x.ateCents)!;
  return Math.min(saldoCents, Math.round(saldoCents * f.aliquota) + f.adicionalCents);
}

export interface AnoFgts {
  ano: number;
  /** Saque-aniversário recebido neste ano. */
  sacadoNoAnoCents: Cents;
  sacadoAcumuladoCents: Cents;
  /** Saldo que fica preso na conta no saque-aniversário. */
  saldoAniversarioCents: Cents;
  /** Saldo no saque-rescisão (nada é sacado). */
  saldoRescisaoCents: Cents;
  /** Se for demitido sem justa causa no fim deste ano: o que você terá recebido no total em cada modalidade. */
  demitidoRescisaoCents: Cents;
  demitidoAniversarioCents: Cents;
}

/**
 * Saque-aniversário × saque-rescisão, ano a ano, no mesmo emprego.
 * Regra geral: no aniversário, quem é demitido recebe só a multa de 40%; o saldo continua preso.
 * Simplificações: o saldo atual conta como depósitos deste contrato; o saque ocorre uma vez por ano, antes dos depósitos.
 */
export function compararSaqueFgts(p: {
  saldoCents: Cents;
  brutoCents: Cents;
  anos: number;
  /** Rendimento do FGTS ao ano (3% + TR; a TR anda perto de zero). */
  rendimentoAnualPct: number;
}): AnoFgts[] {
  const r = p.rendimentoAnualPct / 100;
  const deposito = fgtsAnual(p.brutoCents);
  let saldoA = p.saldoCents;
  let saldoR = p.saldoCents;
  let baseMulta = p.saldoCents;
  let acumulado = 0;
  const linhas: AnoFgts[] = [];
  for (let ano = 1; ano <= Math.max(1, Math.min(40, p.anos)); ano++) {
    const saque = saqueAniversario(saldoA);
    saldoA = Math.round((saldoA - saque) * (1 + r)) + deposito;
    saldoR = Math.round(saldoR * (1 + r)) + deposito;
    acumulado += saque;
    baseMulta += deposito;
    const multa = Math.round(baseMulta * FGTS_MULTA);
    linhas.push({
      ano,
      sacadoNoAnoCents: saque,
      sacadoAcumuladoCents: acumulado,
      saldoAniversarioCents: saldoA,
      saldoRescisaoCents: saldoR,
      demitidoRescisaoCents: saldoR + multa,
      demitidoAniversarioCents: acumulado + multa,
    });
  }
  return linhas;
}
