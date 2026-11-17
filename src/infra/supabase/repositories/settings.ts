import type { SupabaseClient } from '@supabase/supabase-js';
import { check, num } from './shared';

export interface Ajustes {
  ipcaPercent: number;
  cdiPercent: number;
  minBalanceCents: number;
  hideValues: boolean;
  theme: 'system' | 'light' | 'dark';
  /** Horas de trabalho por semana para o selo de tempo nos gastos; 0 = desligado. */
  workHoursWeek: number;
}
export const AJUSTES_PADRAO: Ajustes = {
  ipcaPercent: 4.5,
  cdiPercent: 14,
  minBalanceCents: 0,
  hideValues: false,
  theme: 'system',
  workHoursWeek: 40,
};

export class SupabaseSettingsRepository {
  constructor(private readonly db: SupabaseClient) {}
  async get(): Promise<Ajustes> {
    const { data, error } = await this.db
      .from('app_settings')
      .select('ipca_expected_percent,cdi_expected_percent,min_balance_cents,hide_values,theme,work_hours_week')
      .maybeSingle();
    check(error, 'ler ajustes');
    return data
      ? {
          ipcaPercent: num(data.ipca_expected_percent),
          cdiPercent: num(data.cdi_expected_percent),
          minBalanceCents: num(data.min_balance_cents),
          hideValues: data.hide_values,
          theme: data.theme,
          workHoursWeek: num(data.work_hours_week),
        }
      : AJUSTES_PADRAO;
  }
  async save(a: Partial<Ajustes>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (a.ipcaPercent !== undefined) row.ipca_expected_percent = a.ipcaPercent;
    if (a.cdiPercent !== undefined) row.cdi_expected_percent = a.cdiPercent;
    if (a.minBalanceCents !== undefined) row.min_balance_cents = a.minBalanceCents;
    if (a.hideValues !== undefined) row.hide_values = a.hideValues;
    if (a.theme !== undefined) row.theme = a.theme;
    if (a.workHoursWeek !== undefined) row.work_hours_week = a.workHoursWeek;
    const { error } = await this.db.from('app_settings').upsert(row);
    check(error, 'salvar ajustes');
  }
}
