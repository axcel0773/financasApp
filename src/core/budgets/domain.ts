import { LIMITE_ALERTA_ORCAMENTO } from '../shared/constants';
import type { Cents } from '../shared/money';
import { ehBeneficio, type WalletKind } from '../wallets/domain';

export interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  monthlyBudgetCents: Cents | null;
}

export interface GastoDoMes {
  walletKind: WalletKind;
  cents: Cents;
}

/** Sobra = recebido − gastos pagos por conta/cartão/dinheiro. Gastos com VR/VA NÃO entram. */
export function calcularSobraDoMes(recebidoCents: Cents, gastos: GastoDoMes[]): Cents {
  const gasto = gastos.filter((g) => !ehBeneficio(g.walletKind)).reduce((s, g) => s + g.cents, 0);
  return recebidoCents - gasto;
}

export type EstadoOrcamento = 'sem_limite' | 'ok' | 'alerta' | 'estourado';
export interface StatusOrcamento {
  usadoPct: number;
  restanteCents: Cents;
  estado: EstadoOrcamento;
}

export function statusOrcamento(limiteCents: Cents | null, gastoCents: Cents): StatusOrcamento {
  if (limiteCents === null || limiteCents <= 0)
    return { usadoPct: 0, restanteCents: 0, estado: 'sem_limite' };
  const ratio = gastoCents / limiteCents;
  const estado: EstadoOrcamento =
    ratio > 1 ? 'estourado' : ratio >= LIMITE_ALERTA_ORCAMENTO ? 'alerta' : 'ok';
  return { usadoPct: Math.round(ratio * 100), restanteCents: limiteCents - gastoCents, estado };
}

export function validarCategoria(i: { name: string; color: string | null }): string | null {
  const nome = i.name.trim();
  if (nome.length < 1 || nome.length > 40) return 'O nome deve ter de 1 a 40 caracteres.';
  if (i.color !== null && !/^#[0-9a-fA-F]{6}$/.test(i.color)) return 'Cor inválida.';
  return null;
}
