import type { Competencia } from '../shared/competencia';
import type { Cents } from '../shared/money';
import type { Category } from './domain';

export interface CategoryRepository {
  list(): Promise<Category[]>;
  setBudget(id: string, cents: Cents | null): Promise<void>;
  spendByCategory(
    competencia: Competencia,
  ): Promise<{ categoryId: string | null; spentCents: Cents }[]>;
}
