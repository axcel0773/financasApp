import { cache } from 'react';
import { geradorUuid, relogioSistema } from '@/core/shared/clock';
import { createSupabaseServer } from '@/infra/supabase/client.server';
import { SupabaseBenefitRepository } from '@/infra/supabase/repositories/benefits';
import { SupabaseCategoryRepository } from '@/infra/supabase/repositories/categories';
import { SupabaseGoalRepository } from '@/infra/supabase/repositories/goals';
import { SupabaseIncomeRepository } from '@/infra/supabase/repositories/income';
import { SupabaseInvestmentRepository } from '@/infra/supabase/repositories/investments';
import { SupabaseRecurringRepository } from '@/infra/supabase/repositories/recurring';
import { SupabaseSettingsRepository } from '@/infra/supabase/repositories/settings';
import { SupabaseTransactionRepository } from '@/infra/supabase/repositories/transactions';
import { SupabaseTransferRepository } from '@/infra/supabase/repositories/transfers';
import { SupabaseTripRepository } from '@/infra/supabase/repositories/trips';
import { SupabaseWalletRepository } from '@/infra/supabase/repositories/wallets';

/** Único lugar que instancia repositórios concretos. Um container por requisição. */
export const getContainer = cache(async () => {
  const db = await createSupabaseServer();
  const transactions = new SupabaseTransactionRepository(db);
  return {
    db,
    clock: relogioSistema,
    ids: geradorUuid,
    transactions,
    queries: transactions,
    wallets: new SupabaseWalletRepository(db),
    transfers: new SupabaseTransferRepository(db),
    trips: new SupabaseTripRepository(db),
    categories: new SupabaseCategoryRepository(db),
    income: new SupabaseIncomeRepository(db),
    benefits: new SupabaseBenefitRepository(db),
    recurring: new SupabaseRecurringRepository(db),
    goals: new SupabaseGoalRepository(db),
    investments: new SupabaseInvestmentRepository(db),
    settings: new SupabaseSettingsRepository(db),
  };
});

/** Cria carteiras/categorias/tabelas de imposto na primeira visita (RPC `seed_defaults`, idempotente). */
export const garantirDadosIniciais = cache(async () => {
  const c = await getContainer();
  const carteiras = await c.wallets.list();
  if (carteiras.length === 0) {
    const { error } = await c.db.rpc('seed_defaults');
    if (error) throw new Error(`Falha ao criar dados iniciais (${error.code})`);
  }
});
