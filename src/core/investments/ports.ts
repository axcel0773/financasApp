import type { Cents } from '../shared/money';
import type { Aporte, Investimento } from './domain';

export interface InvestmentRepository {
  list(): Promise<Investimento[]>;
  create(i: Omit<Investimento, 'id' | 'archived'>): Promise<string>;
  entries(): Promise<Aporte[]>;
  addEntry(a: Aporte): Promise<void>;
  /** Último saldo informado por investimento. */
  latestBalances(): Promise<{ investmentId: string; balanceOn: string; balanceCents: Cents }[]>;
  setBalance(investmentId: string, balanceOn: string, cents: Cents): Promise<void>;
}
