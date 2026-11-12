import type { Wallet, WalletBalance, WalletKind } from './domain';

export interface WalletRepository {
  list(): Promise<Wallet[]>;
  arquivadas(): Promise<Wallet[]>;
  balances(): Promise<WalletBalance[]>;
  update(
    id: string,
    patch: Partial<Pick<Wallet, 'name' | 'closingDay' | 'dueDay' | 'limitCents' | 'openingCents'>>,
  ): Promise<void>;
  create(w: {
    kind: WalletKind;
    name: string;
    closingDay: number | null;
    dueDay: number | null;
    limitCents: number | null;
    openingCents: number;
  }): Promise<void>;
  /** Arquivar esconde a carteira das listas; o histórico continua intacto. */
  setArchived(id: string, archived: boolean): Promise<void>;
}
