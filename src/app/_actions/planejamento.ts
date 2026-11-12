'use server';

import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { criarParcelamento, gerarFixosDoMes } from '@/core/recurring/application';
import { err, ok } from '@/core/shared/result';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import {
  competencia,
  data,
  dinheiroOpcional,
  dinheiroPositivo,
  inteiro,
  lerForm,
  texto,
  uuid,
  uuidOpcional,
} from '../_lib/schemas';

export async function salvarOrcamentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid, limit: dinheiroOpcional }), fd);
    if (!p.ok) return p;
    if (p.value.limit !== null && p.value.limit < 0) return err('O limite não pode ser negativo.');
    const c = await getContainer();
    await c.categories.setBudget(p.value.id, p.value.limit);
    return ok(undefined);
  }, 'Orçamento salvo.');
}

export async function salvarCartaoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        id: uuid,
        closingDay: inteiro(1, 31),
        dueDay: inteiro(1, 31),
        limit: dinheiroOpcional,
      }),
      fd,
    );
    if (!p.ok) return p;
    const c = await getContainer();
    await c.wallets.update(p.value.id, {
      closingDay: p.value.closingDay,
      dueDay: p.value.dueDay,
      limitCents: p.value.limit,
    });
    return ok(undefined);
  }, 'Cartão atualizado.');
}

const regra = z.object({
  id: uuidOpcional,
  name: texto(80),
  dayOfMonth: inteiro(1, 31),
  amount: dinheiroPositivo,
  categoryId: uuidOpcional,
  walletId: uuid,
  startOn: data,
  active: z.string().optional(),
});
export async function salvarRegraAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(regra, fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.recurring.salvarRegra({
      id: p.value.id ?? undefined,
      name: p.value.name,
      dayOfMonth: p.value.dayOfMonth,
      amountCents: p.value.amount,
      categoryId: p.value.categoryId,
      walletId: p.value.walletId,
      active: fd.get('id') ? p.value.active === 'on' : true,
      startOn: p.value.startOn,
    });
    return ok(undefined);
  }, 'Fixo salvo.');
}

export async function gerarFixosAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let criados = 0;
  const r = await executar(async () => {
    const p = lerForm(z.object({ competencia }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    criados = await gerarFixosDoMes(c.recurring, p.value.competencia);
    return ok(undefined);
  });
  return r.ok
    ? {
        ok: true,
        message:
          criados === 0 ? 'Nada novo para gerar neste mês.' : `${criados} lançamento(s) gerado(s).`,
      }
    : r;
}

const parcelamento = z.object({
  description: texto(80),
  total: dinheiroPositivo,
  installments: inteiro(2, 120),
  firstOn: data,
  categoryId: uuidOpcional,
  walletId: uuid,
});
export async function criarParcelamentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(parcelamento, fd);
    if (!p.ok) return p;
    const c = await getContainer();
    return criarParcelamento(c.recurring, {
      description: p.value.description,
      totalCents: p.value.total,
      installments: p.value.installments,
      firstOn: p.value.firstOn,
      categoryId: p.value.categoryId,
      walletId: p.value.walletId,
    });
  }, 'Parcelamento criado.');
}
