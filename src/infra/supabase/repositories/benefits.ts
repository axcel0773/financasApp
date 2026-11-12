import type { SupabaseClient } from '@supabase/supabase-js';
import type { BenefitCredit, BenefitRepository } from '@/core/benefits/ports';
import { check, num } from './shared';

export class SupabaseBenefitRepository implements BenefitRepository {
  constructor(private readonly db: SupabaseClient) {}
  async credits(walletId?: string): Promise<BenefitCredit[]> {
    let q = this.db
      .from('benefit_credits')
      .select('id,wallet_id,credited_on,amount_cents')
      .order('credited_on', { ascending: false });
    if (walletId) q = q.eq('wallet_id', walletId);
    const { data, error } = await q;
    check(error, 'listar créditos de benefício');
    return (data ?? []).map((c) => ({
      id: c.id,
      walletId: c.wallet_id,
      creditedOn: c.credited_on,
      amountCents: num(c.amount_cents),
    }));
  }
  async addCredit(c: Omit<BenefitCredit, 'id'>): Promise<void> {
    const { error } = await this.db
      .from('benefit_credits')
      .insert({ wallet_id: c.walletId, credited_on: c.creditedOn, amount_cents: c.amountCents });
    check(error, 'registrar crédito');
  }
  async updateCredit(
    id: string,
    p: Partial<Pick<BenefitCredit, 'creditedOn' | 'amountCents'>>,
  ): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (p.creditedOn) patch.credited_on = p.creditedOn;
    if (p.amountCents !== undefined) patch.amount_cents = p.amountCents;
    const { error } = await this.db.from('benefit_credits').update(patch).eq('id', id);
    check(error, 'editar crédito');
  }
  async removeCredit(id: string): Promise<void> {
    const { error } = await this.db.from('benefit_credits').delete().eq('id', id);
    check(error, 'remover crédito');
  }
}
