import type { DomainError } from '../../shared/errors';
import { domainError } from '../../shared/errors';
import { err, ok, type Result } from '../../shared/result';
import type { Clock } from '../../shared/clock';
import { validarTransacao, type NewTransactionInput, type Transaction } from '../domain';
import type { TransactionRepository } from './ports';

export async function criarTransacao(
  repo: TransactionRepository,
  input: NewTransactionInput,
): Promise<Result<Transaction, DomainError>> {
  const v = validarTransacao(input);
  if (!v.ok) return v;
  return ok(await repo.insert(v.value));
}

export async function editarTransacao(
  repo: TransactionRepository,
  id: string,
  patch: {
    walletId: string;
    categoryId: string | null;
    amountCents: number;
    occurredOn: string;
    note?: string | null;
  },
): Promise<Result<Transaction, DomainError>> {
  const atual = await repo.get(id);
  if (!atual) return err(domainError('nao_encontrada', 'Lançamento não encontrado.'));
  const v = validarTransacao({ ...patch, clientId: atual.clientId, kind: atual.kind });
  if (!v.ok) return v;
  return ok(
    await repo.update(id, {
      walletId: patch.walletId,
      categoryId: patch.categoryId,
      amountCents: v.value.amountCents,
      occurredOn: v.value.occurredOn,
      note: v.value.note ?? null,
    }),
  );
}

export async function excluirTransacao(
  repo: TransactionRepository,
  clock: Clock,
  id: string,
): Promise<void> {
  await repo.setDeletedAt(id, clock.agora().toISOString());
}
export async function desfazerExclusao(repo: TransactionRepository, id: string): Promise<void> {
  await repo.setDeletedAt(id, null);
}
