'use server';

import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { ok } from '@/core/shared/result';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import {
  data,
  dataOpcional,
  dinheiro,
  dinheiroOpcional,
  dinheiroPositivo,
  lerForm,
  texto,
  textoOpcional,
  uuid,
} from '../_lib/schemas';

const TIPOS = ['fixed_income', 'treasury', 'stocks', 'funds', 'crypto', 'other'] as const;

export async function criarInvestimentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        kind: z.enum(TIPOS),
        name: texto(80),
        institution: textoOpcional(80),
        rate: z.string().trim(),
        maturityOn: dataOpcional,
        balance: dinheiroOpcional,
      }),
      fd,
    );
    if (!p.ok) return p;
    if (p.value.balance !== null && p.value.balance < 0)
      return { ok: false as const, error: 'O saldo não pode ser negativo.' };
    const taxa = p.value.rate === '' ? null : Number(p.value.rate.replace(',', '.'));
    if (taxa !== null && (!Number.isFinite(taxa) || taxa < 0 || taxa > 1000))
      return { ok: false as const, error: 'Taxa inválida.' };
    const c = await getContainer();
    const id = await c.investments.create({
      kind: p.value.kind,
      name: p.value.name,
      institution: p.value.institution,
      annualRatePercent: taxa,
      maturityOn: p.value.maturityOn,
    });
    // Saldo informado já no cadastro: vira o saldo de hoje e o valor aplicado (o rendimento conta daqui em diante).
    if (p.value.balance !== null && p.value.balance > 0) {
      const hoje = c.clock.hoje();
      await c.investments.setBalance(id, hoje, p.value.balance);
      await c.investments.addEntry({ investmentId: id, occurredOn: hoje, amountCents: p.value.balance });
    }
    return ok(undefined);
  }, 'Investimento cadastrado.');
}

/** Aporte (+) ou resgate (−). O sinal vem do tipo escolhido, não do número digitado. */
export async function registrarAporteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        investmentId: uuid,
        tipo: z.enum(['aporte', 'resgate']),
        amount: dinheiroPositivo,
        occurredOn: data,
      }),
      fd,
    );
    if (!p.ok) return p;
    const c = await getContainer();
    await c.investments.addEntry({
      investmentId: p.value.investmentId,
      occurredOn: p.value.occurredOn,
      amountCents: p.value.tipo === 'aporte' ? p.value.amount : -p.value.amount,
    });
    return ok(undefined);
  }, 'Movimentação registrada.');
}

export async function atualizarSaldoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ investmentId: uuid, balance: dinheiro, balanceOn: data }), fd);
    if (!p.ok) return p;
    if (p.value.balance < 0) return { ok: false as const, error: 'O saldo não pode ser negativo.' };
    const c = await getContainer();
    await c.investments.setBalance(p.value.investmentId, p.value.balanceOn, p.value.balance);
    return ok(undefined);
  }, 'Saldo atualizado.');
}

export async function salvarMetaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        id: z.string(),
        kind: z.enum(['emergency', 'other']),
        name: texto(80),
        target: dinheiroPositivo,
        current: dinheiro,
        deadline: dataOpcional,
        planned: dinheiroOpcional,
      }),
      fd,
    );
    if (!p.ok) return p;
    const c = await getContainer();
    await c.goals.save({
      id: p.value.id || undefined,
      kind: p.value.kind,
      name: p.value.name,
      targetCents: p.value.target,
      currentCents: Math.max(0, p.value.current),
      deadline: p.value.deadline,
      plannedMonthlyCents: p.value.planned,
    });
    return ok(undefined);
  }, 'Meta salva.');
}
