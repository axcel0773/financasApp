'use server';

import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { gerarPrevistos } from '@/core/income/domain';
import { estimarHolerite } from '@/core/income/holerite';
import { err, ok } from '@/core/shared/result';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import {
  competencia,
  data,
  dinheiro,
  dinheiroOpcional,
  dinheiroPositivo,
  inteiroOpcional,
  lerForm,
  texto,
  textoOpcional,
  uuid,
  uuidOpcional,
} from '../_lib/schemas';

const fonte = z.object({
  id: uuidOpcional,
  name: texto(80),
  employer: textoOpcional(80),
  gross: dinheiroPositivo,
  advancePercent: inteiroOpcional(0, 100),
  advanceDay: inteiroOpcional(1, 31),
  finalDay: inteiroOpcional(1, 31),
  walletId: uuidOpcional,
  dependents: inteiroOpcional(0, 20),
  alimony: dinheiroOpcional,
});
export async function salvarFonteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(fonte, fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.income.salvarFonte({
      id: p.value.id ?? undefined,
      kind: 'salary',
      name: p.value.name,
      employer: p.value.employer,
      grossCents: p.value.gross,
      advancePercent: p.value.advancePercent,
      advanceDay: p.value.advanceDay,
      finalDay: p.value.finalDay,
      walletId: p.value.walletId,
      active: true,
      dependents: p.value.dependents ?? 0,
      alimonyCents: Math.max(0, p.value.alimony ?? 0),
    });
    return ok(undefined);
  }, 'Salário salvo.');
}

/** Gera adiantamento e pagamento final previstos. Só funciona se as datas estiverem cadastradas. Idempotente. */
export async function gerarPrevistosAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ competencia }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    const [fontes, tabelas] = await Promise.all([c.income.fontes(), c.income.tabelas()]);
    if (!tabelas) return err('Tabelas de INSS/IR não encontradas.');
    const previstos = fontes.flatMap((f) =>
      gerarPrevistos(
        f,
        p.value.competencia,
        estimarHolerite({
          grossCents: f.grossCents,
          dependentes: f.dependents,
          pensaoCents: f.alimonyCents,
          inss: tabelas.inss,
          irrf: tabelas.irrf,
          paramsIrrf: tabelas.paramsIrrf,
        }),
      ),
    );
    if (previstos.length === 0)
      return err(
        'Cadastre as datas do salário (adiantamento e pagamento final) para gerar os previstos.',
      );
    await c.income.inserirPrevistos(previstos);
    return ok(undefined);
  }, 'Previstos gerados.');
}

const confirmar = z.object({
  id: uuid,
  receivedOn: data,
  gross: dinheiroPositivo,
  deductions: dinheiro,
  walletId: uuidOpcional,
});
export async function confirmarRecebimentoAction(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(confirmar, fd);
    if (!p.ok) return p;
    if (p.value.deductions < 0 || p.value.deductions > p.value.gross)
      return err('Os descontos não podem ser maiores que o bruto.');
    const c = await getContainer();
    await c.income.confirmar(p.value.id, {
      receivedOn: p.value.receivedOn,
      grossCents: p.value.gross,
      deductionsCents: p.value.deductions,
      netCents: p.value.gross - p.value.deductions,
      walletId: p.value.walletId,
    });
    return ok(undefined);
  }, 'Recebimento confirmado.');
}

const extra = z.object({
  sourceId: uuid,
  receivedOn: data,
  net: dinheiroPositivo,
  note: textoOpcional(200),
  walletId: uuidOpcional,
});
export async function registrarExtraAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(extra, fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.income.inserirExtra({
      sourceId: p.value.sourceId,
      competencia: p.value.receivedOn.slice(0, 7),
      receivedOn: p.value.receivedOn,
      netCents: p.value.net,
      note: p.value.note,
      walletId: p.value.walletId,
    });
    return ok(undefined);
  }, 'Recebimento registrado.');
}
