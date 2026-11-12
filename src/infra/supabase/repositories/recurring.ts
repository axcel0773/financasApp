import type { SupabaseClient } from '@supabase/supabase-js';
import { primeiroDia, ultimoDia } from '@/core/shared/competencia';
import type { Parcela } from '@/core/installments/domain';
import { chaveOcorrencia, type OcorrenciaFixa, type RegraFixa } from '@/core/recurring/domain';
import type { NovoPlano, PlanoParcelado, RecurringRepository } from '@/core/recurring/ports';
import { check, num, UNIQUE_VIOLATION } from './shared';

export class SupabaseRecurringRepository implements RecurringRepository {
  constructor(private readonly db: SupabaseClient) {}

  async regras(): Promise<RegraFixa[]> {
    const { data, error } = await this.db
      .from('recurring_rules')
      .select('id,name,day_of_month,amount_cents,category_id,wallet_id,active,start_on')
      .order('day_of_month');
    check(error, 'listar fixos');
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      dayOfMonth: r.day_of_month,
      amountCents: num(r.amount_cents),
      categoryId: r.category_id,
      walletId: r.wallet_id,
      active: r.active,
      startOn: r.start_on,
    }));
  }
  async salvarRegra(r: Parameters<RecurringRepository['salvarRegra']>[0]): Promise<void> {
    const row = {
      name: r.name,
      day_of_month: r.dayOfMonth,
      amount_cents: r.amountCents,
      category_id: r.categoryId,
      wallet_id: r.walletId,
      active: r.active,
      start_on: r.startOn,
    };
    const { error } = r.id
      ? await this.db.from('recurring_rules').update(row).eq('id', r.id)
      : await this.db.from('recurring_rules').insert(row);
    check(error, 'salvar fixo');
  }
  async chavesGeradas(competencia: string): Promise<Set<string>> {
    const { data, error } = await this.db
      .from('transactions')
      .select('recurring_rule_id,occurred_on')
      .not('recurring_rule_id', 'is', null)
      .gte('occurred_on', primeiroDia(competencia))
      .lte('occurred_on', ultimoDia(competencia));
    check(error, 'ler fixos já gerados');
    return new Set(
      (data ?? []).map((t) => chaveOcorrencia(t.recurring_rule_id as string, t.occurred_on)),
    );
  }
  async gerar(ocs: OcorrenciaFixa[]): Promise<number> {
    let criadas = 0;
    for (const o of ocs) {
      const { error } = await this.db.from('transactions').insert({
        client_id: crypto.randomUUID(),
        wallet_id: o.walletId,
        category_id: o.categoryId,
        kind: 'expense',
        amount_cents: o.amountCents,
        occurred_on: o.date,
        note: o.name,
        origin: 'recurring',
        recurring_rule_id: o.ruleId,
      });
      if (!error) criadas++;
      else if (error.code !== UNIQUE_VIOLATION) check(error, 'gerar fixo');
    }
    return criadas;
  }
  async planos(): Promise<PlanoParcelado[]> {
    const { data, error } = await this.db
      .from('installment_plans')
      .select('id,description,total_cents,installments,first_on,category_id,wallet_id')
      .order('first_on', { ascending: false });
    check(error, 'listar parcelamentos');
    return (data ?? []).map((p) => ({
      id: p.id,
      description: p.description,
      totalCents: num(p.total_cents),
      installments: p.installments,
      firstOn: p.first_on,
      categoryId: p.category_id,
      walletId: p.wallet_id,
    }));
  }
  async criarPlano(plano: NovoPlano, parcelas: Parcela[]): Promise<void> {
    const { data, error } = await this.db
      .from('installment_plans')
      .insert({
        description: plano.description,
        total_cents: plano.totalCents,
        installments: plano.installments,
        first_on: plano.firstOn,
        category_id: plano.categoryId,
        wallet_id: plano.walletId,
      })
      .select('id')
      .single();
    check(error, 'criar parcelamento');
    const planId = (data as { id: string }).id;
    const { error: e2 } = await this.db.from('transactions').insert(
      parcelas.map((p) => ({
        client_id: crypto.randomUUID(),
        wallet_id: plano.walletId,
        category_id: plano.categoryId,
        kind: 'expense',
        amount_cents: p.valorCents,
        occurred_on: p.data,
        note: `${plano.description} (${p.numero}/${plano.installments})`,
        origin: 'installment',
        installment_plan_id: planId,
        installment_number: p.numero,
      })),
    );
    if (e2) {
      await this.db.from('installment_plans').delete().eq('id', planId); // desfaz o plano se as parcelas falharem
      check(e2, 'criar parcelas');
    }
  }
  async excluirRegra(id: string): Promise<void> {
    const { error } = await this.db.from('recurring_rules').delete().eq('id', id);
    check(error, 'excluir fixo');
  }
  async excluirPlano(id: string, hoje: string, quando: string): Promise<void> {
    const { error: e1 } = await this.db
      .from('transactions')
      .update({ deleted_at: quando })
      .eq('installment_plan_id', id)
      .gt('occurred_on', hoje)
      .is('deleted_at', null);
    check(e1, 'cancelar parcelas futuras');
    const { error } = await this.db.from('installment_plans').delete().eq('id', id);
    check(error, 'excluir parcelamento');
  }
}
