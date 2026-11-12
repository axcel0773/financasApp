import type { IsoDate } from '../../shared/competencia';
import type { Transaction, TransactionHistoryEntry, NewTransactionInput } from '../domain';

export interface TransactionFilter {
  de?: IsoDate;
  ate?: IsoDate;
  walletId?: string;
  categoryId?: string;
  apenasLixeira?: boolean;
  limite?: number;
  /** Paginação por cursor: itens antes desta data/id. */
  cursor?: { occurredOn: IsoDate; id: string };
}

export interface TransactionRepository {
  list(filter: TransactionFilter): Promise<Transaction[]>;
  get(id: string): Promise<Transaction | null>;
  /** Idempotente por (user, clientId): reenvio devolve o existente. */
  insert(input: NewTransactionInput): Promise<Transaction>;
  update(
    id: string,
    patch: Partial<
      Pick<Transaction, 'walletId' | 'categoryId' | 'amountCents' | 'occurredOn' | 'note'>
    >,
  ): Promise<Transaction>;
  setDeletedAt(id: string, at: string | null): Promise<void>;
  history(id: string): Promise<TransactionHistoryEntry[]>;
}

export interface GastoDetalhado {
  walletId: string;
  walletKind: import('../../wallets/domain').WalletKind;
  categoryId: string | null;
  cents: number;
  occurredOn: IsoDate;
  kind: 'expense' | 'income';
}
/** Consulta de leitura usada por Início, Orçamento, Relatórios e Fluxo (despesas/receitas avulsas ativas). */
export interface TransactionQueries {
  detalhado(de: IsoDate, ate: IsoDate): Promise<GastoDetalhado[]>;
  somaMensal(
    ultimos: number,
  ): Promise<
    {
      competencia: string;
      receivedCents: number;
      spentCents: number;
      benefitSpentCents: number;
      leftoverCents: number;
    }[]
  >;
}
