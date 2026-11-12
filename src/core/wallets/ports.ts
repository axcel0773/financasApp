import type { Wallet, WalletBalance } from './domain';

export interface WalletRepository {
  list(): Promise<Wallet[]>;
  balances(): Promise<WalletBalance[]>;
  update(
    id: string,
    patch: Partial<Pick<Wallet, 'name' | 'closingDay' | 'dueDay' | 'limitCents' | 'openingCents'>>,
  ): Promise<void>;
}
