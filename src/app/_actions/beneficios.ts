'use server';

import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { ok } from '@/core/shared/result';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import { data, dinheiroPositivo, lerForm, uuid } from '../_lib/schemas';

export async function adicionarCreditoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ walletId: uuid, creditedOn: data, amount: dinheiroPositivo }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.benefits.addCredit({
      walletId: p.value.walletId,
      creditedOn: p.value.creditedOn,
      amountCents: p.value.amount,
    });
    return ok(undefined);
  }, 'Crédito registrado.');
}
export async function editarCreditoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid, creditedOn: data, amount: dinheiroPositivo }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.benefits.updateCredit(p.value.id, {
      creditedOn: p.value.creditedOn,
      amountCents: p.value.amount,
    });
    return ok(undefined);
  }, 'Crédito atualizado.');
}
export async function removerCreditoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.benefits.removeCredit(p.value.id);
    return ok(undefined);
  }, 'Crédito removido.');
}
