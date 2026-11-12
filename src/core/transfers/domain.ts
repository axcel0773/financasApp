import { isIsoDate, type IsoDate } from '../shared/competencia';
import { MAX_NOTA } from '../shared/constants';
import { domainError, type DomainError } from '../shared/errors';
import type { Cents } from '../shared/money';
import { err, ok, type Result } from '../shared/result';

export interface Transferencia {
  id: string;
  clientId: string;
  fromWalletId: string;
  toWalletId: string;
  amountCents: Cents;
  occurredOn: IsoDate;
  note: string | null;
  deletedAt: string | null;
}
export interface NovaTransferencia {
  clientId: string;
  fromWalletId: string;
  toWalletId: string;
  amountCents: Cents;
  occurredOn: IsoDate;
  note?: string | null;
}

/** Transferência move dinheiro entre carteiras: não é gasto nem receita, então não entra em sobra nem orçamento. */
export function validarTransferencia(i: NovaTransferencia): Result<NovaTransferencia, DomainError> {
  if (!Number.isSafeInteger(i.amountCents) || i.amountCents <= 0)
    return err(domainError('valor_invalido', 'O valor deve ser maior que zero.'));
  if (!isIsoDate(i.occurredOn)) return err(domainError('data_invalida', 'Data inválida.'));
  if (i.fromWalletId === i.toWalletId)
    return err(domainError('mesma_carteira', 'Escolha carteiras diferentes na origem e no destino.'));
  const note = i.note?.trim() || null;
  if (note && note.length > MAX_NOTA)
    return err(domainError('nota_longa', `A nota pode ter até ${MAX_NOTA} caracteres.`));
  return ok({ ...i, note });
}
