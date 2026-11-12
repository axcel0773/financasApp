import type { Competencia, IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';
import type { Parcela } from '../installments/domain';
import type { OcorrenciaFixa, RegraFixa } from './domain';

export interface PlanoParcelado {
  id: string;
  description: string;
  totalCents: Cents;
  installments: number;
  firstOn: IsoDate;
  categoryId: string | null;
  walletId: string;
}
export type NovoPlano = Omit<PlanoParcelado, 'id'>;

export interface RecurringRepository {
  regras(): Promise<RegraFixa[]>;
  salvarRegra(r: Omit<RegraFixa, 'id'> & { id?: string }): Promise<void>;
  /** Chaves `regra|data` de todas as ocorrências já geradas na competência (inclui as da lixeira). */
  chavesGeradas(competencia: Competencia): Promise<Set<string>>;
  /** Insere ignorando duplicatas (índice único). Devolve quantas foram criadas. */
  gerar(ocorrencias: OcorrenciaFixa[]): Promise<number>;
  planos(): Promise<PlanoParcelado[]>;
  criarPlano(plano: NovoPlano, parcelas: Parcela[]): Promise<void>;
}
