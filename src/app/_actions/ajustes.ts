'use server';

import { z } from 'zod';
import { IDS_DESTAQUE } from '@/ui/theme/destaques';
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
        accent: z.enum(IDS_DESTAQUE).default('lima'),
        jornada: z
          .string()
          .trim()
          .transform((s) => (s === '' ? 0 : Number(s.replace(',', '.'))))
          .refine((n) => Number.isFinite(n) && n >= 0 && n <= 80, 'Jornada: informe de 0 a 80 horas por semana.'),
        metaPoupanca: z
          .string()
          .trim()
          .transform((s) => (s === '' ? 20 : Number(s.replace(',', '.'))))
          .refine((n) => Number.isFinite(n) && n >= 0 && n <= 90, 'Meta de poupança: informe de 0 a 90%.'),
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
      accent: p.value.accent,
      workHoursWeek: Math.round(p.value.jornada * 10) / 10,
      savingsGoalPercent: Math.round(p.value.metaPoupanca * 10) / 10,
      hideValues: fd.get('hideValues') === 'on',
    });
    return ok(undefined);
  }, 'Ajustes salvos.');
}
