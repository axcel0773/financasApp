import type { IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface BenefitCredit {
  id: string;
  walletId: string;
  creditedOn: IsoDate;
  amountCents: Cents;
}
export interface BenefitRepository {
  credits(walletId?: string): Promise<BenefitCredit[]>;
  addCredit(c: Omit<BenefitCredit, 'id'>): Promise<void>;
  updateCredit(
    id: string,
    patch: Partial<Pick<BenefitCredit, 'creditedOn' | 'amountCents'>>,
  ): Promise<void>;
  removeCredit(id: string): Promise<void>;
}
