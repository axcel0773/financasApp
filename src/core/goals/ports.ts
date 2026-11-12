import type { Cents } from '../shared/money';
import type { Meta } from './domain';

export interface GoalRepository {
  list(): Promise<Meta[]>;
  save(m: Omit<Meta, 'id'> & { id?: string }): Promise<void>;
  setCurrent(id: string, cents: Cents): Promise<void>;
}
