'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { relogioSistema } from '@/core/shared/clock';
import {
  criarTransacao,
  desfazerExclusao,
  editarTransacao,
  excluirTransacao,
} from '@/core/transactions/application/use-cases';
import { senhaConfere } from '@/infra/supabase/confirm-password';
import { executar, exigirUsuario } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import {
  data,
  dinheiroPositivo,
  lerForm,
  texto,
  textoOpcional,
  uuid,
  uuidOpcional,
} from '../_lib/schemas';

const novo = z.object({
  clientId: uuid,
  walletId: uuid,
  categoryId: z.string().uuid().nullable(),
  kind: z.enum(['expense', 'income']),
  amountCents: z.number().int().positive('O valor deve ser maior que zero.'),
  occurredOn: data,
  note: z.string().max(200).nullable().optional(),
});

/** Chamada pelo formulário e também pela fila offline (mesmo caminho, reenvio idempotente por clientId). */
export async function criarLancamentoAction(input: unknown): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(novo, input as Record<string, unknown>);
    if (!p.ok) return p;
    const c = await getContainer();
    return criarTransacao(c.transactions, { ...p.value, note: p.value.note ?? null });
  }, 'Lançamento salvo.');
}

const editar = z.object({
  id: uuid,
  walletId: uuid,
  categoryId: uuidOpcional,
  amount: dinheiroPositivo,
  occurredOn: data,
  note: textoOpcional(200),
  tripId: z.union([z.string().uuid('Seleção inválida.'), z.literal('')]).optional(),
});
export async function editarLancamentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await executar(async () => {
    const p = lerForm(editar, fd);
    if (!p.ok) return p;
    const c = await getContainer();
    return editarTransacao(c.transactions, p.value.id, {
      walletId: p.value.walletId,
      categoryId: p.value.categoryId,
      amountCents: p.value.amount,
      occurredOn: p.value.occurredOn,
      note: p.value.note,
      tripId: p.value.tripId === undefined ? undefined : p.value.tripId || null,
    });
  }, 'Alterações salvas.');
  if (r.ok) redirect('/gastos');
  return r;
}

const editarRemoto = z.object({
  id: uuid,
  walletId: uuid,
  categoryId: z.string().uuid().nullable(),
  amountCents: z.number().int().positive('O valor deve ser maior que zero.'),
  occurredOn: data,
  note: z.string().max(200).nullable().optional(),
});
/** Mesma edição, chamada pela fila offline (sem redirecionar). */
export async function editarLancamentoRemotoAction(input: unknown): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(editarRemoto, input as Record<string, unknown>);
    if (!p.ok) return p;
    const c = await getContainer();
    return editarTransacao(c.transactions, p.value.id, {
      walletId: p.value.walletId,
      categoryId: p.value.categoryId,
      amountCents: p.value.amountCents,
      occurredOn: p.value.occurredOn,
      note: p.value.note ?? null,
    });
  }, 'Alterações salvas.');
}

export async function excluirLancamentoAction(id: string): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), { id });
    if (!p.ok) return p;
    const c = await getContainer();
    await excluirTransacao(c.transactions, relogioSistema, p.value.id);
  }, 'Lançamento excluído.');
}
export async function desfazerExclusaoAction(id: string): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), { id });
    if (!p.ok) return p;
    const c = await getContainer();
    await desfazerExclusao(c.transactions, p.value.id);
  }, 'Lançamento restaurado.');
}

/** Apagar definitivamente exige a senha. */
export async function esvaziarLixeiraAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ senha: texto(128) }), fd);
    if (!p.ok) return p;
    const u = await exigirUsuario();
    if (!(await senhaConfere(u.email, p.value.senha)))
      return { ok: false as const, error: 'Senha incorreta.' };
    const c = await getContainer();
    const { error } = await c.db.from('transactions').delete().not('deleted_at', 'is', null);
    if (error) throw new Error(error.code);
  }, 'Lixeira esvaziada.');
}
