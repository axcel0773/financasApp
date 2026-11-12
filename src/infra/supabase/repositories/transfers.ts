import type { SupabaseClient } from '@supabase/supabase-js';
import type { NovaTransferencia, Transferencia } from '@/core/transfers/domain';
import type { TransferRepository } from '@/core/transfers/ports';
import { check, num, UNIQUE_VIOLATION } from './shared';

export class SupabaseTransferRepository implements TransferRepository {
  constructor(private readonly db: SupabaseClient) {}
  async list(limite = 30): Promise<Transferencia[]> {
    const { data, error } = await this.db
      .from('transfers')
      .select('id,client_id,from_wallet_id,to_wallet_id,amount_cents,occurred_on,note,deleted_at')
      .is('deleted_at', null)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limite);
    check(error, 'listar transferências');
    return (data ?? []).map((t) => ({
      id: t.id,
      clientId: t.client_id,
      fromWalletId: t.from_wallet_id,
      toWalletId: t.to_wallet_id,
      amountCents: num(t.amount_cents),
      occurredOn: t.occurred_on,
      note: t.note,
      deletedAt: t.deleted_at,
    }));
  }
  async insert(t: NovaTransferencia): Promise<void> {
    const { error } = await this.db.from('transfers').insert({
      client_id: t.clientId,
      from_wallet_id: t.fromWalletId,
      to_wallet_id: t.toWalletId,
      amount_cents: t.amountCents,
      occurred_on: t.occurredOn,
      note: t.note ?? null,
    });
    if (error && error.code !== UNIQUE_VIOLATION) check(error, 'registrar transferência');
  }
  async setDeletedAt(id: string, quando: string | null): Promise<void> {
    const { error } = await this.db.from('transfers').update({ deleted_at: quando }).eq('id', id);
    check(error, 'excluir transferência');
  }
}
