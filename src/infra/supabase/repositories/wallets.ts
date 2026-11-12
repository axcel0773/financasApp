import type { SupabaseClient } from '@supabase/supabase-js';
import type { Wallet, WalletBalance, WalletKind } from '@/core/wallets/domain';
import type { WalletRepository } from '@/core/wallets/ports';
import { check, num, numOrNull } from './shared';

export class SupabaseWalletRepository implements WalletRepository {
  constructor(private readonly db: SupabaseClient) {}

  private async carregar(arquivadas: boolean): Promise<Wallet[]> {
    const { data, error } = await this.db
      .from('wallets')
      .select('id,kind,name,closing_day,due_day,limit_cents,opening_cents,archived')
      .eq('archived', arquivadas)
      .order('created_at');
    check(error, 'listar carteiras');
    return (data ?? []).map((w) => ({
      id: w.id,
      kind: w.kind as WalletKind,
      name: w.name,
      closingDay: numOrNull(w.closing_day),
      dueDay: numOrNull(w.due_day),
      limitCents: numOrNull(w.limit_cents),
      openingCents: num(w.opening_cents),
      archived: w.archived,
    }));
  }
  list(): Promise<Wallet[]> {
    return this.carregar(false);
  }
  arquivadas(): Promise<Wallet[]> {
    return this.carregar(true);
  }
  async balances(): Promise<WalletBalance[]> {
    const { data, error } = await this.db
      .from('v_wallet_balance')
      .select('wallet_id,kind,name,balance_cents');
    check(error, 'ler saldos');
    return (data ?? []).map((b) => ({
      walletId: b.wallet_id,
      kind: b.kind as WalletKind,
      name: b.name,
      balanceCents: num(b.balance_cents),
    }));
  }
  async update(id: string, p: Parameters<WalletRepository['update']>[1]): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (p.name !== undefined) patch.name = p.name;
    if (p.closingDay !== undefined) patch.closing_day = p.closingDay;
    if (p.dueDay !== undefined) patch.due_day = p.dueDay;
    if (p.limitCents !== undefined) patch.limit_cents = p.limitCents;
    if (p.openingCents !== undefined) patch.opening_cents = p.openingCents;
    const { error } = await this.db.from('wallets').update(patch).eq('id', id);
    check(error, 'atualizar carteira');
  }
  async create(w: Parameters<WalletRepository['create']>[0]): Promise<void> {
    const { error } = await this.db.from('wallets').insert({
      kind: w.kind,
      name: w.name,
      closing_day: w.closingDay,
      due_day: w.dueDay,
      limit_cents: w.limitCents,
      opening_cents: w.openingCents,
    });
    check(error, 'criar carteira');
  }
  async setArchived(id: string, archived: boolean): Promise<void> {
    const { error } = await this.db.from('wallets').update({ archived }).eq('id', id);
    check(error, 'arquivar carteira');
  }
}
