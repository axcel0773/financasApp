import type { NovaViagem, Viagem } from './domain';

export interface TripRepository {
  list(): Promise<Viagem[]>;
  get(id: string): Promise<Viagem | null>;
  create(v: NovaViagem): Promise<void>;
  update(id: string, v: NovaViagem): Promise<void>;
  /** Os lançamentos ficam e voltam a ser gastos normais (trip_id vira nulo). */
  remove(id: string): Promise<void>;
}
