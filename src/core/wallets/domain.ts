import type { Cents } from '../shared/money';

export type WalletKind = 'checking' | 'meal_voucher' | 'food_voucher' | 'credit_card' | 'cash';

export interface Wallet {
  id: string;
  kind: WalletKind;
  name: string;
  closingDay: number | null;
  dueDay: number | null;
  limitCents: Cents | null;
  openingCents: Cents;
  archived: boolean;
}
export interface WalletBalance {
  walletId: string;
  kind: WalletKind;
  name: string;
  balanceCents: Cents;
}

export const ehBeneficio = (k: WalletKind): boolean => k === 'meal_voucher' || k === 'food_voucher';
export const ROTULO_CARTEIRA: Record<WalletKind, string> = {
  checking: 'Conta',
  meal_voucher: 'VR',
  food_voucher: 'VA',
  credit_card: 'Cartão',
  cash: 'Dinheiro',
};

export function validarCarteira(i: {
  name: string;
  kind: WalletKind;
  closingDay: number | null;
  dueDay: number | null;
}): string | null {
  const nome = i.name.trim();
  if (nome.length < 1 || nome.length > 60) return 'O nome deve ter de 1 a 60 caracteres.';
  if (i.kind === 'credit_card') {
    const dia = (d: number | null) => d !== null && Number.isInteger(d) && d >= 1 && d <= 31;
    if (!dia(i.closingDay) || !dia(i.dueDay)) return 'Informe o dia de fechamento e o de vencimento (1 a 31).';
  }
  return null;
}
