import type { Cents } from '../shared/money';

/**
 * Parâmetros legais das calculadoras, por ano. Atualizar no ano seguinte = acrescentar uma entrada.
 * As faixas de INSS e IRRF não estão aqui: vêm das tabelas editáveis do app (Mais → Tabelas de INSS e IRRF).
 */
export interface ParametrosAno {
  ano: number;
  salarioMinimoCents: Cents;
  /** Teto de faturamento anual do MEI. */
  limiteMeiAnualCents: Cents;
  /** DAS do MEI de serviços: 5% do mínimo (INSS) + R$ 5 de ISS. */
  dasMeiServicosCents: Cents;
}

export const PARAMETROS: ParametrosAno[] = [
  // Decreto 12.797/2025 (mínimo R$ 1.621); teto do MEI de R$ 81 mil (LC 155/2016) ainda em vigor.
  { ano: 2026, salarioMinimoCents: 162_100, limiteMeiAnualCents: 8_100_000, dasMeiServicosCents: 8_105 + 500 },
];

/** Parâmetros do ano pedido; se o ano ainda não foi cadastrado, usa o mais recente (e a tela avisa). */
export function parametrosDoAno(ano: number): ParametrosAno & { desatualizado: boolean } {
  const exato = PARAMETROS.find((p) => p.ano === ano);
  if (exato) return { ...exato, desatualizado: false };
  const ultimo = [...PARAMETROS].sort((a, b) => b.ano - a.ano)[0]!;
  return { ...ultimo, desatualizado: true };
}

/** Alíquota do FGTS depositada pelo empregador. */
export const FGTS_ALIQUOTA = 0.08;
/** Multa rescisória da demissão sem justa causa, sobre os depósitos do contrato. */
export const FGTS_MULTA = 0.4;
