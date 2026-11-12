import type { Cents } from '../shared/money';
import type { Aporte, Investimento } from './domain';

export interface InvestmentRepository {
  list(): Promise<Investimento[]>;
  update(id: string, i: Omit<Investimento, 'id' | 'archived'>): Promise<void>;
  setArchived(id: string, archived: boolean): Promise<void>;
  create(i: Omit<Investimento, 'id' | 'archived'>): Promise<string>;
  entries(): Promise<Aporte[]>;
  addEntry(a: Aporte): Promise<void>;
  /** Último saldo informado por investimento. */
  latestBalances(): Promise<{ investmentId: string; balanceOn: string; balanceCents: Cents }[]>;
  setBalance(investmentId: string, balanceOn: string, cents: Cents): Promise<void>;
}
