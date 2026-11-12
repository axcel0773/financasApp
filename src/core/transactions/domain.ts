import { domainError, type DomainError } from '../shared/errors';
import { err, ok, type Result } from '../shared/result';
import { isIsoDate, type IsoDate } from '../shared/competencia';
import { MAX_NOTA } from '../shared/constants';
import type { Cents } from '../shared/money';

export type TransactionKind = 'expense' | 'income';
export type TransactionOrigin = 'manual' | 'recurring' | 'installment';

export interface Transaction {
  id: string;
  clientId: string;
  walletId: string;
  categoryId: string | null;
  kind: TransactionKind;
  amountCents: Cents;
  occurredOn: IsoDate;
  note: string | null;
  origin: TransactionOrigin;
  recurringRuleId: string | null;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  deletedAt: string | null;
  /** Viagem à qual o gasto pertence (nulo = dia a dia). */
  tripId?: string | null;
}

export interface NewTransactionInput {
  clientId: string;
  walletId: string;
  categoryId: string | null;
  kind: TransactionKind;
  amountCents: number;
  occurredOn: string;
  note?: string | null;
  tripId?: string | null;
}

export type TransactionHistoryEntry = {
  changedAt: string;
  oldAmountCents: Cents;
  newAmountCents: Cents;
  oldNote: string | null;
  newNote: string | null;
};

/** Regras de valor/data/nota. O sinal vem do `kind`, nunca do número. */
export function validarTransacao(
  input: NewTransactionInput,
): Result<NewTransactionInput, DomainError> {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0)
    return err(domainError('valor_invalido', 'O valor deve ser maior que zero.'));
  if (!isIsoDate(input.occurredOn)) return err(domainError('data_invalida', 'Data inválida.'));
  const note = input.note?.trim() || null;
  if (note && note.length > MAX_NOTA)
    return err(domainError('nota_longa', `A descrição pode ter até ${MAX_NOTA} caracteres.`));
  return ok({ ...input, note });
}
