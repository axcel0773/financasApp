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
    /** Indefinido mantém a viagem atual; nulo tira o gasto da viagem. */
    tripId?: string | null;
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
      ...(patch.tripId !== undefined && atual.kind === 'expense' ? { tripId: patch.tripId } : {}),
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

/** Importação em lote: valida cada linha, descarta as inválidas e deixa o banco ignorar as repetidas (clientId). */
export async function importarLancamentos(
  repo: TransactionRepository,
  inputs: NewTransactionInput[],
): Promise<{ criados: number; repetidos: number; invalidos: number }> {
  const validos: NewTransactionInput[] = [];
  let invalidos = 0;
  for (const i of inputs) {
    const v = validarTransacao(i);
    if (v.ok) validos.push(v.value);
    else invalidos++;
  }
  const criados = validos.length ? await repo.inserirEmLote(validos) : 0;
  return { criados, repetidos: validos.length - criados, invalidos };
}
