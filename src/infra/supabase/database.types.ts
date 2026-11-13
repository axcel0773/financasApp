/**
 * Formato das linhas do banco (schema `public`), gerado a partir do Supabase em 12/11/2026
 * (ferramenta "generate_typescript_types"; equivalente a `supabase gen types typescript`).
 * Versão enxuta: só `Row` de tabelas/views e enums. Para atualizar após uma migração, gere de novo e
 * ajuste aqui. Os repositórios usam `DbRow<'tabela'>` em vez de tipos escritos à mão.
 */
export type Enums = {
  goal_kind: 'emergency' | 'other';
  income_kind: 'salary' | 'thirteenth' | 'plr' | 'extra';
  investment_kind: 'fixed_income' | 'treasury' | 'stocks' | 'funds' | 'crypto' | 'other';
  receipt_kind: 'advance' | 'final' | 'thirteenth_1' | 'thirteenth_2' | 'vacation' | 'plr' | 'extra';
  tax_kind: 'inss' | 'irrf';
  tx_kind: 'expense' | 'income' | 'transfer';
  tx_origin: 'manual' | 'recurring' | 'installment';
  wallet_kind: 'checking' | 'meal_voucher' | 'food_voucher' | 'credit_card' | 'cash';
};
type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export interface Tables {
  app_settings: { cdi_expected_percent: number; hide_values: boolean; ipca_expected_percent: number; min_balance_cents: number; theme: string; updated_at: string; user_id: string };
  benefit_credits: { amount_cents: number; created_at: string; credited_on: string; id: string; user_id: string; wallet_id: string };
  categories: { color: string | null; created_at: string; icon: string | null; id: string; monthly_budget_cents: number | null; name: string; sort_order: number; user_id: string };
  category_rules: { category_id: string; created_at: string; id: string; keyword: string; user_id: string };
  goals: { created_at: string; current_cents: number; deadline: string | null; id: string; kind: Enums['goal_kind']; name: string; planned_monthly_cents: number | null; target_cents: number; updated_at: string; user_id: string };
  income_receipts: { competencia: string; created_at: string; deductions_cents: number; expected_net_cents: number | null; expected_on: string | null; gross_cents: number | null; id: string; kind: Enums['receipt_kind']; net_cents: number | null; note: string | null; received_on: string | null; source_id: string; updated_at: string; user_id: string; wallet_id: string | null };
  income_sources: { active: boolean; advance_day: number | null; advance_percent: number | null; alimony_cents: number; created_at: string; dependents: number; employer: string | null; final_day: number | null; gross_cents: number; id: string; kind: Enums['income_kind']; name: string; updated_at: string; user_id: string; wallet_id: string | null };
  installment_plans: { category_id: string | null; created_at: string; description: string; first_on: string; id: string; installments: number; total_cents: number; user_id: string; wallet_id: string };
  investment_balances: { balance_cents: number; balance_on: string; created_at: string; id: string; investment_id: string; user_id: string };
  investment_entries: { amount_cents: number; created_at: string; id: string; investment_id: string; occurred_on: string; user_id: string };
  investments: { annual_rate_percent: number | null; archived: boolean; created_at: string; id: string; institution: string | null; kind: Enums['investment_kind']; maturity_on: string | null; name: string; updated_at: string; user_id: string };
  recurring_rules: { active: boolean; amount_cents: number; category_id: string | null; created_at: string; day_of_month: number; id: string; name: string; start_on: string; updated_at: string; user_id: string; wallet_id: string };
  tax_tables: { brackets: Json; created_at: string; id: string; kind: Enums['tax_kind']; params: Json; user_id: string; valid_from: string };
  transaction_history: { changed_at: string; id: string; new_amount_cents: number; new_note: string | null; old_amount_cents: number; old_note: string | null; transaction_id: string; user_id: string };
  transactions: { amount_cents: number; category_id: string | null; client_id: string; created_at: string; deleted_at: string | null; id: string; installment_number: number | null; installment_plan_id: string | null; kind: Enums['tx_kind']; note: string | null; occurred_on: string; origin: Enums['tx_origin']; recurring_rule_id: string | null; trip_id: string | null; updated_at: string; user_id: string; wallet_id: string };
  transfers: { amount_cents: number; client_id: string; created_at: string; deleted_at: string | null; from_wallet_id: string; id: string; note: string | null; occurred_on: string; to_wallet_id: string; user_id: string };
  trips: { budget_cents: number; created_at: string; end_on: string | null; id: string; name: string; people: number; start_on: string; user_id: string };
  wallets: { archived: boolean; closing_day: number | null; created_at: string; due_day: number | null; id: string; kind: Enums['wallet_kind']; limit_cents: number | null; name: string; opening_cents: number; updated_at: string; user_id: string };
  // views (colunas podem vir nulas)
  v_category_spend: { category_id: string | null; competencia: string | null; spent_cents: number | null; user_id: string | null };
  v_monthly_summary: { benefit_spent_cents: number | null; competencia: string | null; leftover_cents: number | null; received_cents: number | null; spent_cents: number | null; user_id: string | null };
  v_wallet_balance: { balance_cents: number | null; kind: Enums['wallet_kind'] | null; name: string | null; user_id: string | null; wallet_id: string | null };
}

/** Linha de uma tabela/view; use `Pick` para só as colunas lidas. */
export type DbRow<T extends keyof Tables> = Tables[T];
