import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/core/budgets/domain';
import type { CategoryRepository } from '@/core/budgets/ports';
import { check, num, numOrNull } from './shared';

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Category[]> {
    const { data, error } = await this.db
      .from('categories')
      .select('id,name,color,icon,monthly_budget_cents')
      .order('sort_order')
      .order('name');
    check(error, 'listar categorias');
    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      monthlyBudgetCents: numOrNull(c.monthly_budget_cents),
    }));
  }
  async setBudget(id: string, cents: number | null): Promise<void> {
    const { error } = await this.db
      .from('categories')
      .update({ monthly_budget_cents: cents })
      .eq('id', id);
    check(error, 'salvar orçamento');
  }
  async spendByCategory(competencia: string) {
    const { data, error } = await this.db
      .from('v_category_spend')
      .select('category_id,spent_cents')
      .eq('competencia', competencia);
    check(error, 'ler gasto por categoria');
    return (data ?? []).map((r) => ({
      categoryId: r.category_id as string | null,
      spentCents: num(r.spent_cents),
    }));
  }
}
