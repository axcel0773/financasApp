'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { err, ok } from '@/core/shared/result';
import { criarTransacao } from '@/core/transactions/application/use-cases';
import { validarViagem } from '@/core/trips/domain';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import { data, dataOpcional, dinheiro, dinheiroOpcional, dinheiroPositivo, inteiro, lerForm, texto, textoOpcional, uuid, uuidOpcional } from '../_lib/schemas';

export async function salvarViagemAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        id: z.string().optional(),
        name: texto(80),
        startOn: data,
        endOn: dataOpcional,
        budget: dinheiroOpcional,
        people: inteiro(1, 20),
      }),
      fd,
    );
    if (!p.ok) return p;
    const v = validarViagem({
      name: p.value.name,
      startOn: p.value.startOn,
      endOn: p.value.endOn,
      budgetCents: p.value.budget ?? 0, // em branco = viagem sem limite
      people: p.value.people,
    });
    if (!v.ok) return v;
    const c = await getContainer();
    if (p.value.id) await c.trips.update(p.value.id, v.value);
    else await c.trips.create(v.value);
    return ok(undefined);
  }, 'Viagem salva.');
}

export async function excluirViagemAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.trips.remove(p.value.id);
    return ok(undefined);
  }, 'Viagem excluída. Os lançamentos continuam como gastos normais.');
  if (r.ok) redirect('/mais/viagens');
  return r;
}

export async function criarGastoViagemAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        clientId: uuid,
        tripId: uuid,
        walletId: uuid,
        categoryId: uuidOpcional,
        amount: dinheiroPositivo,
        occurredOn: data,
        note: textoOpcional(200),
      }),
      fd,
    );
    if (!p.ok) return p;
    const c = await getContainer();
    const viagem = await c.trips.get(p.value.tripId);
    if (!viagem) return err('Viagem não encontrada.');
    return criarTransacao(c.transactions, {
      clientId: p.value.clientId,
      walletId: p.value.walletId,
      categoryId: p.value.categoryId,
      kind: 'expense',
      amountCents: p.value.amount,
      occurredOn: p.value.occurredOn,
      note: p.value.note,
      tripId: p.value.tripId,
    });
  }, 'Gasto da viagem salvo.');
}
