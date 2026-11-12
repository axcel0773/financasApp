import type { Competencia } from '../shared/competencia';
import type { Cents } from '../shared/money';
import type { Category } from './domain';

export interface RegraCategoria {
  id: string;
  keyword: string;
  categoryId: string;
}
export interface CategoryRepository {
  list(): Promise<Category[]>;
  setBudget(id: string, cents: Cents | null): Promise<void>;
  spendByCategory(
    competencia: Competencia,
  ): Promise<{ categoryId: string | null; spentCents: Cents }[]>;
  create(c: { name: string; color: string | null }): Promise<void>;
  update(id: string, c: { name: string; color: string | null }): Promise<void>;
  /** Os lançamentos da categoria ficam sem categoria (o banco usa `on delete set null`). */
  remove(id: string): Promise<void>;
  regras(): Promise<RegraCategoria[]>;
  adicionarRegra(keyword: string, categoryId: string): Promise<void>;
  removerRegra(id: string): Promise<void>;
}
