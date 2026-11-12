'use server';

import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { ok } from '@/core/shared/result';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import { dinheiro, lerForm } from '../_lib/schemas';

const pct = z
  .string()
  .trim()
  .transform((s) => Number(s.replace(',', '.')))
  .refine((n) => Number.isFinite(n) && n >= 0 && n <= 100, 'Percentual inválido.');
export async function salvarAjustesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        ipca: pct,
        cdi: pct,
        minBalance: dinheiro,
        theme: z.enum(['system', 'light', 'dark']),
      }),
      fd,
    );
    if (!p.ok) return p;
    const c = await getContainer();
    await c.settings.save({
      ipcaPercent: p.value.ipca,
      cdiPercent: p.value.cdi,
      minBalanceCents: p.value.minBalance,
      theme: p.value.theme,
      hideValues: fd.get('hideValues') === 'on',
    });
    return ok(undefined);
  }, 'Ajustes salvos.');
}
