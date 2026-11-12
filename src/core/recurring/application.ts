import type { Competencia } from '../shared/competencia';
import { isIsoDate } from '../shared/competencia';
import { domainError, type DomainError } from '../shared/errors';
import { err, ok, type Result } from '../shared/result';
import { gerarParcelas } from '../installments/domain';
import { ocorrenciasPendentes } from './domain';
import type { NovoPlano, RecurringRepository } from './ports';

/** Gera os fixos do mês. Idempotente: chamar de novo não cria nada novo. */
export async function gerarFixosDoMes(
  repo: RecurringRepository,
  competencia: Competencia,
): Promise<number> {
  const [regras, ja] = await Promise.all([repo.regras(), repo.chavesGeradas(competencia)]);
  const pendentes = ocorrenciasPendentes(regras, competencia, ja);
  return pendentes.length ? repo.gerar(pendentes) : 0;
}

export async function criarParcelamento(
  repo: RecurringRepository,
  plano: NovoPlano,
): Promise<Result<number, DomainError>> {
  if (!Number.isSafeInteger(plano.totalCents) || plano.totalCents <= 0)
    return err(domainError('valor_invalido', 'O valor total deve ser maior que zero.'));
  if (!Number.isInteger(plano.installments) || plano.installments < 2 || plano.installments > 120)
    return err(domainError('parcelas_invalidas', 'Informe de 2 a 120 parcelas.'));
  if (!isIsoDate(plano.firstOn))
    return err(domainError('data_invalida', 'Data da 1ª parcela inválida.'));
  const parcelas = gerarParcelas(plano.totalCents, plano.installments, plano.firstOn);
  await repo.criarPlano(plano, parcelas);
  return ok(parcelas.length);
}
