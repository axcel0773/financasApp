import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/core/budgets/domain';
import type { CategoryRepository, RegraCategoria } from '@/core/budgets/ports';
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
  async create(c: { name: string; color: string | null }): Promise<void> {
    const { error } = await this.db.from('categories').insert({ name: c.name.trim(), color: c.color });
    check(error, 'criar categoria');
  }
  async update(id: string, c: { name: string; color: string | null }): Promise<void> {
    const { error } = await this.db
      .from('categories')
      .update({ name: c.name.trim(), color: c.color })
      .eq('id', id);
    check(error, 'atualizar categoria');
  }
  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('categories').delete().eq('id', id);
    check(error, 'excluir categoria');
  }
  async regras(): Promise<RegraCategoria[]> {
    const { data, error } = await this.db
      .from('category_rules')
      .select('id,keyword,category_id')
      .order('keyword');
    check(error, 'listar regras de categoria');
    return (data ?? []).map((r) => ({ id: r.id, keyword: r.keyword, categoryId: r.category_id }));
  }
  async adicionarRegra(keyword: string, categoryId: string): Promise<void> {
    const { error } = await this.db
      .from('category_rules')
      .upsert({ keyword: keyword.trim().toLowerCase(), category_id: categoryId }, { onConflict: 'user_id,keyword' });
    check(error, 'salvar regra de categoria');
  }
  async removerRegra(id: string): Promise<void> {
    const { error } = await this.db.from('category_rules').delete().eq('id', id);
    check(error, 'excluir regra de categoria');
  }
}
