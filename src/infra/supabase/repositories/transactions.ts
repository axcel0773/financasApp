import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NewTransactionInput,
  Transaction,
  TransactionHistoryEntry,
} from '@/core/transactions/domain';
import type {
  GastoDetalhado,
  TransactionFilter,
  TransactionQueries,
  TransactionRepository,
} from '@/core/transactions/application/ports';
import type { WalletKind } from '@/core/wallets/domain';
import { check, num, numOrNull, UNIQUE_VIOLATION } from './shared';

const COLS =
  'id,client_id,wallet_id,category_id,kind,amount_cents,occurred_on,note,origin,recurring_rule_id,installment_plan_id,installment_number,deleted_at,trip_id';

type Row = {
  id: string;
  client_id: string;
  wallet_id: string;
  category_id: string | null;
  kind: 'expense' | 'income';
  amount_cents: number;
  occurred_on: string;
  note: string | null;
  origin: Transaction['origin'];
  recurring_rule_id: string | null;
  installment_plan_id: string | null;
  installment_number: number | null;
  deleted_at: string | null;
  trip_id: string | null;
};
const toDomain = (r: Row): Transaction => ({
  id: r.id,
  clientId: r.client_id,
  walletId: r.wallet_id,
  categoryId: r.category_id,
  kind: r.kind,
  amountCents: num(r.amount_cents),
  occurredOn: r.occurred_on,
  note: r.note,
  origin: r.origin,
  recurringRuleId: r.recurring_rule_id,
  installmentPlanId: r.installment_plan_id,
  installmentNumber: numOrNull(r.installment_number),
  deletedAt: r.deleted_at,
  tripId: r.trip_id,
});

export class SupabaseTransactionRepository implements TransactionRepository, TransactionQueries {
  constructor(private readonly db: SupabaseClient) {}

  async list(f: TransactionFilter): Promise<Transaction[]> {
    let q = this.db
      .from('transactions')
      .select(COLS)
      .order('occurred_on', { ascending: false })
      .order('id', { ascending: false })
      .limit(f.limite ?? 50);
    q = f.apenasLixeira ? q.not('deleted_at', 'is', null) : q.is('deleted_at', null);
    if (f.de) q = q.gte('occurred_on', f.de);
    if (f.ate) q = q.lte('occurred_on', f.ate);
    if (f.walletId) q = q.eq('wallet_id', f.walletId);
    if (f.categoryId) q = q.eq('category_id', f.categoryId);
    if (f.tripId) q = q.eq('trip_id', f.tripId);
    if (f.texto) q = q.ilike('note', `%${f.texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    if (f.cursor)
      q = q.or(
        `occurred_on.lt.${f.cursor.occurredOn},and(occurred_on.eq.${f.cursor.occurredOn},id.lt.${f.cursor.id})`,
      );
    const { data, error } = await q;
    check(error, 'listar lançamentos');
    return (data as Row[]).map(toDomain);
  }

  async inserirEmLote(inputs: NewTransactionInput[]): Promise<number> {
    let criados = 0;
    for (let i = 0; i < inputs.length; i += 500) {
      const { data, error } = await this.db
        .from('transactions')
        .upsert(
          inputs.slice(i, i + 500).map((t) => ({
            client_id: t.clientId,
            wallet_id: t.walletId,
            category_id: t.categoryId,
            kind: t.kind,
            amount_cents: t.amountCents,
            occurred_on: t.occurredOn,
            note: t.note ?? null,
          })),
          { onConflict: 'user_id,client_id', ignoreDuplicates: true },
        )
        .select('id');
      check(error, 'importar lançamentos');
      criados += data?.length ?? 0;
    }
    return criados;
  }

  async get(id: string): Promise<Transaction | null> {
    const { data, error } = await this.db
      .from('transactions')
      .select(COLS)
      .eq('id', id)
      .maybeSingle();
    check(error, 'buscar lançamento');
    return data ? toDomain(data as Row) : null;
  }

  async insert(i: NewTransactionInput): Promise<Transaction> {
    const { data, error } = await this.db
      .from('transactions')
      .insert({
        client_id: i.clientId,
        wallet_id: i.walletId,
        category_id: i.categoryId,
        kind: i.kind,
        amount_cents: i.amountCents,
        occurred_on: i.occurredOn,
        note: i.note ?? null,
        trip_id: i.tripId ?? null,
      })
      .select(COLS)
      .single();
    if (error?.code === UNIQUE_VIOLATION) {
      // Reenvio offline: devolve o lançamento já gravado (idempotência).
      const existente = await this.db
        .from('transactions')
        .select(COLS)
        .eq('client_id', i.clientId)
        .single();
      check(existente.error, 'buscar lançamento existente');
      return toDomain(existente.data as Row);
    }
    check(error, 'criar lançamento');
    return toDomain(data as Row);
  }

  async update(
    id: string,
    p: Parameters<TransactionRepository['update']>[1],
  ): Promise<Transaction> {
    const patch: Record<string, unknown> = {};
    if (p.walletId !== undefined) patch.wallet_id = p.walletId;
    if (p.categoryId !== undefined) patch.category_id = p.categoryId;
    if (p.amountCents !== undefined) patch.amount_cents = p.amountCents;
    if (p.occurredOn !== undefined) patch.occurred_on = p.occurredOn;
    if (p.note !== undefined) patch.note = p.note;
    const { data, error } = await this.db
      .from('transactions')
      .update(patch)
      .eq('id', id)
      .select(COLS)
      .single();
    check(error, 'editar lançamento');
    return toDomain(data as Row);
  }

  async setDeletedAt(id: string, at: string | null): Promise<void> {
    const { error } = await this.db.from('transactions').update({ deleted_at: at }).eq('id', id);
    check(error, at ? 'excluir lançamento' : 'restaurar lançamento');
  }

  async history(id: string): Promise<TransactionHistoryEntry[]> {
    const { data, error } = await this.db
      .from('transaction_history')
      .select('changed_at,old_amount_cents,new_amount_cents,old_note,new_note')
      .eq('transaction_id', id)
      .order('changed_at', { ascending: false });
    check(error, 'ler histórico');
    return (data ?? []).map((h) => ({
      changedAt: h.changed_at,
      oldAmountCents: num(h.old_amount_cents),
      newAmountCents: num(h.new_amount_cents),
      oldNote: h.old_note,
      newNote: h.new_note,
    }));
  }

  async detalhado(de: string, ate: string): Promise<GastoDetalhado[]> {
    const { data, error } = await this.db
      .from('transactions')
      .select('wallet_id,category_id,kind,amount_cents,occurred_on,trip_id,wallets!inner(kind)')
      .is('deleted_at', null)
      .gte('occurred_on', de)
      .lte('occurred_on', ate)
      .limit(5000);
    check(error, 'ler movimentações do período');
    return (data ?? []).map((r) => {
      const w = r.wallets as unknown as { kind: WalletKind } | { kind: WalletKind }[];
      return {
        walletId: r.wallet_id,
        walletKind: Array.isArray(w) ? w[0]!.kind : w.kind,
        categoryId: r.category_id,
        cents: num(r.amount_cents),
        occurredOn: r.occurred_on,
        kind: r.kind,
        tripId: r.trip_id,
      };
    });
  }

  async somaMensal(ultimos: number) {
    const { data, error } = await this.db
      .from('v_monthly_summary')
      .select('competencia,received_cents,spent_cents,benefit_spent_cents,leftover_cents')
      .order('competencia', { ascending: false })
      .limit(ultimos);
    check(error, 'ler resumo mensal');
    return (data ?? [])
      .map((r) => ({
        competencia: r.competencia as string,
        receivedCents: num(r.received_cents),
        spentCents: num(r.spent_cents),
        benefitSpentCents: num(r.benefit_spent_cents),
        leftoverCents: num(r.leftover_cents),
      }))
      .reverse();
  }
}
