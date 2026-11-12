import type { SupabaseClient } from '@supabase/supabase-js';
import type { Aporte, Investimento } from '@/core/investments/domain';
import type { InvestmentRepository } from '@/core/investments/ports';
import { check, num, numOrNull } from './shared';

export class SupabaseInvestmentRepository implements InvestmentRepository {
  constructor(private readonly db: SupabaseClient) {}
  async list(): Promise<Investimento[]> {
    const { data, error } = await this.db
      .from('investments')
      .select('id,kind,name,institution,annual_rate_percent,maturity_on,archived')
      .eq('archived', false)
      .order('created_at');
    check(error, 'listar investimentos');
    return (data ?? []).map((i) => ({
      id: i.id,
      kind: i.kind,
      name: i.name,
      institution: i.institution,
      annualRatePercent: numOrNull(i.annual_rate_percent),
      maturityOn: i.maturity_on,
      archived: i.archived,
    }));
  }
  async create(i: Omit<Investimento, 'id' | 'archived'>): Promise<string> {
    const { data, error } = await this.db
      .from('investments')
      .insert({
        kind: i.kind,
        name: i.name,
        institution: i.institution,
        annual_rate_percent: i.annualRatePercent,
        maturity_on: i.maturityOn,
      })
      .select('id')
      .single();
    check(error, 'criar investimento');
    return (data as { id: string }).id;
  }
  async entries(): Promise<Aporte[]> {
    const { data, error } = await this.db
      .from('investment_entries')
      .select('investment_id,occurred_on,amount_cents')
      .order('occurred_on', { ascending: false });
    check(error, 'listar aportes');
    return (data ?? []).map((a) => ({
      investmentId: a.investment_id,
      occurredOn: a.occurred_on,
      amountCents: num(a.amount_cents),
    }));
  }
  async addEntry(a: Aporte): Promise<void> {
    const { error } = await this.db
      .from('investment_entries')
      .insert({
        investment_id: a.investmentId,
        occurred_on: a.occurredOn,
        amount_cents: a.amountCents,
      });
    check(error, 'registrar aporte');
  }
  async latestBalances() {
    const { data, error } = await this.db
      .from('investment_balances')
      .select('investment_id,balance_on,balance_cents')
      .order('balance_on', { ascending: false });
    check(error, 'ler saldos');
    const vistos = new Set<string>();
    const out: { investmentId: string; balanceOn: string; balanceCents: number }[] = [];
    for (const b of data ?? [])
      if (!vistos.has(b.investment_id)) {
        vistos.add(b.investment_id);
        out.push({
          investmentId: b.investment_id,
          balanceOn: b.balance_on,
          balanceCents: num(b.balance_cents),
        });
      }
    return out;
  }
  async setBalance(investmentId: string, balanceOn: string, cents: number): Promise<void> {
    const { error } = await this.db
      .from('investment_balances')
      .upsert(
        { investment_id: investmentId, balance_on: balanceOn, balance_cents: cents },
        { onConflict: 'investment_id,balance_on' },
      );
    check(error, 'atualizar saldo');
  }
  async update(id: string, i: Parameters<InvestmentRepository['update']>[1]): Promise<void> {
    const { error } = await this.db
      .from('investments')
      .update({
        kind: i.kind,
        name: i.name,
        institution: i.institution,
        annual_rate_percent: i.annualRatePercent,
        maturity_on: i.maturityOn,
      })
      .eq('id', id);
    check(error, 'atualizar investimento');
  }
  async setArchived(id: string, archived: boolean): Promise<void> {
    const { error } = await this.db.from('investments').update({ archived }).eq('id', id);
    check(error, 'arquivar investimento');
  }
}
