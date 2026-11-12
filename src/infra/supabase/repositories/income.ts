import type { SupabaseClient } from '@supabase/supabase-js';
import type { FonteRenda, NovoPrevisto, Recebimento } from '@/core/income/domain';
import type { Faixa, ParamsIrrf } from '@/core/income/holerite';
import type { IncomeRepository, TabelasImposto } from '@/core/income/ports';
import { check, num, numOrNull, UNIQUE_VIOLATION } from './shared';

type BracketJson = { up_to_cents: number | null; rate: number; deduction_cents: number };
const faixas = (j: unknown): Faixa[] =>
  (j as BracketJson[]).map((b) => ({
    upToCents: b.up_to_cents,
    rate: b.rate,
    deductionCents: b.deduction_cents,
  }));

type ReceiptRow = {
  id: string;
  source_id: string;
  kind: Recebimento['kind'];
  competencia: string;
  expected_on: string | null;
  expected_net_cents: number | null;
  received_on: string | null;
  gross_cents: number | null;
  deductions_cents: number;
  net_cents: number | null;
  wallet_id: string | null;
  note: string | null;
};
const R_COLS =
  'id,source_id,kind,competencia,expected_on,expected_net_cents,received_on,gross_cents,deductions_cents,net_cents,wallet_id,note';
const toReceipt = (r: ReceiptRow): Recebimento => ({
  id: r.id,
  sourceId: r.source_id,
  kind: r.kind,
  competencia: r.competencia,
  expectedOn: r.expected_on,
  expectedNetCents: numOrNull(r.expected_net_cents),
  receivedOn: r.received_on,
  grossCents: numOrNull(r.gross_cents),
  deductionsCents: num(r.deductions_cents),
  netCents: numOrNull(r.net_cents),
  walletId: r.wallet_id,
  note: r.note,
});

export class SupabaseIncomeRepository implements IncomeRepository {
  constructor(private readonly db: SupabaseClient) {}

  async fontes(): Promise<FonteRenda[]> {
    const { data, error } = await this.db
      .from('income_sources')
      .select(
        'id,kind,name,employer,gross_cents,advance_percent,advance_day,final_day,wallet_id,active',
      )
      .order('created_at');
    check(error, 'listar fontes de renda');
    return (data ?? []).map((s) => ({
      id: s.id,
      kind: s.kind,
      name: s.name,
      employer: s.employer,
      grossCents: num(s.gross_cents),
      advancePercent: numOrNull(s.advance_percent),
      advanceDay: numOrNull(s.advance_day),
      finalDay: numOrNull(s.final_day),
      walletId: s.wallet_id,
      active: s.active,
    }));
  }
  async salvarFonte(f: Parameters<IncomeRepository['salvarFonte']>[0]): Promise<void> {
    const row = {
      kind: f.kind,
      name: f.name,
      employer: f.employer,
      gross_cents: f.grossCents,
      advance_percent: f.advancePercent,
      advance_day: f.advanceDay,
      final_day: f.finalDay,
      wallet_id: f.walletId,
      active: f.active,
    };
    const { error } = f.id
      ? await this.db.from('income_sources').update(row).eq('id', f.id)
      : await this.db.from('income_sources').insert(row);
    check(error, 'salvar fonte de renda');
  }
  async recebimentos(de: string, ate: string): Promise<Recebimento[]> {
    const { data, error } = await this.db
      .from('income_receipts')
      .select(R_COLS)
      .gte('competencia', de)
      .lte('competencia', ate)
      .order('competencia', { ascending: false })
      .order('expected_on');
    check(error, 'listar recebimentos');
    return (data as ReceiptRow[]).map(toReceipt);
  }
  async inserirPrevistos(p: NovoPrevisto[]): Promise<void> {
    for (const x of p) {
      const { error } = await this.db
        .from('income_receipts')
        .insert({
          source_id: x.sourceId,
          kind: x.kind,
          competencia: x.competencia,
          expected_on: x.expectedOn,
          expected_net_cents: x.expectedNetCents,
          wallet_id: x.walletId,
        });
      if (error && error.code !== UNIQUE_VIOLATION) check(error, 'gerar recebimentos previstos'); // duplicado = já existe (idempotente)
    }
  }
  async confirmar(id: string, d: Parameters<IncomeRepository['confirmar']>[1]): Promise<void> {
    const { error } = await this.db
      .from('income_receipts')
      .update({
        received_on: d.receivedOn,
        gross_cents: d.grossCents,
        deductions_cents: d.deductionsCents,
        net_cents: d.netCents,
        wallet_id: d.walletId,
      })
      .eq('id', id);
    check(error, 'confirmar recebimento');
  }
  async inserirExtra(d: Parameters<IncomeRepository['inserirExtra']>[0]): Promise<void> {
    const { error } = await this.db
      .from('income_receipts')
      .insert({
        source_id: d.sourceId,
        kind: 'extra',
        competencia: d.competencia,
        received_on: d.receivedOn,
        gross_cents: d.netCents,
        net_cents: d.netCents,
        note: d.note,
        wallet_id: d.walletId,
      });
    check(error, 'registrar recebimento extra');
  }
  async tabelas(): Promise<TabelasImposto | null> {
    const { data, error } = await this.db
      .from('tax_tables')
      .select('kind,valid_from,brackets,params')
      .order('valid_from', { ascending: false });
    check(error, 'ler tabelas de imposto');
    const inss = data?.find((t) => t.kind === 'inss');
    const irrf = data?.find((t) => t.kind === 'irrf');
    if (!inss || !irrf) return null;
    const p = irrf.params as {
      dependent_cents: number;
      simplified_cents: number;
      reducer?: {
        exempt_until_cents: number;
        phase_until_cents: number;
        a_cents: number;
        b: number;
      };
    };
    const paramsIrrf: ParamsIrrf = {
      dependentCents: p.dependent_cents,
      simplifiedCents: p.simplified_cents,
      reducer: p.reducer
        ? {
            exemptUntilCents: p.reducer.exempt_until_cents,
            phaseUntilCents: p.reducer.phase_until_cents,
            aCents: p.reducer.a_cents,
            b: p.reducer.b,
          }
        : undefined,
    };
    return {
      inss: faixas(inss.brackets),
      irrf: faixas(irrf.brackets),
      paramsIrrf,
      validaDesde: { inss: inss.valid_from, irrf: irrf.valid_from },
    };
  }
}
