'use server';

import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { importarLancamentos } from '@/core/transactions/application/use-cases';
import type { NewTransactionInput } from '@/core/transactions/domain';
import { executar, exigirUsuario } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import { data, lerForm, uuid } from '../_lib/schemas';

const entrada = z.object({
  walletId: uuid,
  itens: z
    .array(
      z.object({
        data,
        descricao: z.string().max(200),
        cents: z.number().int().positive(),
        kind: z.enum(['expense', 'income']),
        categoryId: z.string().uuid().nullable(),
      }),
    )
    .min(1, 'Nada para importar.')
    .max(2000, 'Importe no máximo 2.000 linhas por vez.'),
});

/** UUID determinístico: importar o mesmo arquivo duas vezes gera os mesmos ids, e o banco ignora os repetidos. */
function idDeterministico(chave: string): string {
  const h = createHash('sha1').update(chave).digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

export async function importarLancamentosAction(input: unknown): Promise<ActionState> {
  let resumo = '';
  const r = await executar(async () => {
    const p = lerForm(entrada, input as Record<string, unknown>);
    if (!p.ok) return p;
    const u = await exigirUsuario();
    const vistos = new Map<string, number>();
    const lote: NewTransactionInput[] = p.value.itens.map((i) => {
      const base = `${u.id}|${p.value.walletId}|${i.data}|${i.kind}|${i.cents}|${i.descricao}`;
      const n = (vistos.get(base) ?? 0) + 1; // dois itens idênticos no mesmo arquivo continuam distintos
      vistos.set(base, n);
      return {
        clientId: idDeterministico(`${base}|${n}`),
        walletId: p.value.walletId,
        categoryId: i.categoryId,
        kind: i.kind,
        amountCents: i.cents,
        occurredOn: i.data,
        note: i.descricao || null,
      };
    });
    const c = await getContainer();
    const res = await importarLancamentos(c.transactions, lote);
    resumo = `${res.criados} importado(s)` + (res.repetidos ? `, ${res.repetidos} já existia(m)` : '') + (res.invalidos ? `, ${res.invalidos} inválido(s)` : '') + '.';
  });
  return r.ok ? { ok: true, message: resumo } : r;
}
