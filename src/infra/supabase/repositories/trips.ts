import type { SupabaseClient } from '@supabase/supabase-js';
import type { NovaViagem, Viagem } from '@/core/trips/domain';
import type { TripRepository } from '@/core/trips/ports';
import { check, num } from './shared';

const COLS = 'id,name,start_on,end_on,budget_cents,people';
type Row = { id: string; name: string; start_on: string; end_on: string; budget_cents: number; people: number };
const toDomain = (r: Row): Viagem => ({
  id: r.id,
  name: r.name,
  startOn: r.start_on,
  endOn: r.end_on,
  budgetCents: num(r.budget_cents),
  people: r.people,
});
const toRow = (v: NovaViagem) => ({
  name: v.name,
  start_on: v.startOn,
  end_on: v.endOn,
  budget_cents: v.budgetCents,
  people: v.people,
});

export class SupabaseTripRepository implements TripRepository {
  constructor(private readonly db: SupabaseClient) {}
  async list(): Promise<Viagem[]> {
    const { data, error } = await this.db.from('trips').select(COLS).order('start_on', { ascending: false }).limit(200);
    check(error, 'listar viagens');
    return (data as Row[]).map(toDomain);
  }
  async get(id: string): Promise<Viagem | null> {
    const { data, error } = await this.db.from('trips').select(COLS).eq('id', id).maybeSingle();
    check(error, 'buscar viagem');
    return data ? toDomain(data as Row) : null;
  }
  async create(v: NovaViagem): Promise<void> {
    const { error } = await this.db.from('trips').insert(toRow(v));
    check(error, 'criar viagem');
  }
  async update(id: string, v: NovaViagem): Promise<void> {
    const { error } = await this.db.from('trips').update(toRow(v)).eq('id', id);
    check(error, 'atualizar viagem');
  }
  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('trips').delete().eq('id', id);
    check(error, 'excluir viagem');
  }
}
