import type { SupabaseClient } from '@supabase/supabase-js';
import type { Meta } from '@/core/goals/domain';
import type { GoalRepository } from '@/core/goals/ports';
import { check, num, numOrNull } from './shared';

export class SupabaseGoalRepository implements GoalRepository {
  constructor(private readonly db: SupabaseClient) {}
  async list(): Promise<Meta[]> {
    const { data, error } = await this.db
      .from('goals')
      .select('id,kind,name,target_cents,current_cents,deadline,planned_monthly_cents')
      .order('created_at');
    check(error, 'listar metas');
    return (data ?? []).map((g) => ({
      id: g.id,
      kind: g.kind,
      name: g.name,
      targetCents: num(g.target_cents),
      currentCents: num(g.current_cents),
      deadline: g.deadline,
      plannedMonthlyCents: numOrNull(g.planned_monthly_cents),
    }));
  }
  async save(m: Parameters<GoalRepository['save']>[0]): Promise<void> {
    const row = {
      kind: m.kind,
      name: m.name,
      target_cents: m.targetCents,
      current_cents: m.currentCents,
      deadline: m.deadline,
      planned_monthly_cents: m.plannedMonthlyCents,
    };
    const { error } = m.id
      ? await this.db.from('goals').update(row).eq('id', m.id)
      : await this.db.from('goals').insert(row);
    check(error, 'salvar meta');
  }
  async setCurrent(id: string, cents: number): Promise<void> {
    const { error } = await this.db.from('goals').update({ current_cents: cents }).eq('id', id);
    check(error, 'atualizar meta');
  }
  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('goals').delete().eq('id', id);
    check(error, 'excluir meta');
  }
}
