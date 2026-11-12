import type { NovaTransferencia, Transferencia } from './domain';

export interface TransferRepository {
  list(limite?: number): Promise<Transferencia[]>;
  /** Idempotente por (usuário, clientId). */
  insert(t: NovaTransferencia): Promise<void>;
  setDeletedAt(id: string, quando: string | null): Promise<void>;
}
