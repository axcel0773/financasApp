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
