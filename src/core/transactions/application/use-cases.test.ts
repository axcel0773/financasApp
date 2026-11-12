import { describe, expect, it } from 'vitest';
import { relogioFixo } from '../../shared/clock';
import type { Transaction, NewTransactionInput } from '../domain';
import type { TransactionRepository } from './ports';
import {
  criarTransacao,
  desfazerExclusao,
  editarTransacao,
  excluirTransacao,
  importarLancamentos,
} from './use-cases';

function fakeRepo(): TransactionRepository & { rows: Map<string, Transaction> } {
  const rows = new Map<string, Transaction>();
  const mk = (i: NewTransactionInput): Transaction => ({
    id: `id-${rows.size + 1}`,
    clientId: i.clientId,
    walletId: i.walletId,
    categoryId: i.categoryId,
    kind: i.kind,
    amountCents: i.amountCents,
    occurredOn: i.occurredOn,
    note: i.note ?? null,
    origin: 'manual',
    recurringRuleId: null,
    installmentPlanId: null,
    installmentNumber: null,
    deletedAt: null,
  });
  return {
    rows,
    list: async () => [...rows.values()],
    get: async (id) => rows.get(id) ?? null,
    insert: async (i) => {
      const dup = [...rows.values()].find((r) => r.clientId === i.clientId);
      if (dup) return dup;
      const t = mk(i);
      rows.set(t.id, t);
      return t;
    },
    update: async (id, p) => {
      const t = { ...rows.get(id)!, ...p };
      rows.set(id, t);
      return t;
    },
    setDeletedAt: async (id, at) => {
      rows.set(id, { ...rows.get(id)!, deletedAt: at });
    },
    history: async () => [],
    inserirEmLote: async (inputs) => {
      let criados = 0;
      for (const i of inputs) {
        if ([...rows.values()].some((r) => r.clientId === i.clientId)) continue;
        const t = mk(i);
        rows.set(t.id, t);
        criados++;
      }
      return criados;
    },
  };
}
const base: NewTransactionInput = {
  clientId: 'c1',
  walletId: 'w1',
  categoryId: null,
  kind: 'expense',
  amountCents: 4590,
  occurredOn: '2026-11-12',
  note: ' Mercado ',
};

describe('transações', () => {
  it('cria e normaliza a nota', async () => {
    const r = await criarTransacao(fakeRepo(), base);
    expect(r.ok && r.value.note).toBe('Mercado');
  });
  it('rejeita valor zero, negativo ou fracionado', async () => {
    for (const amountCents of [0, -5, 10.5]) {
      const r = await criarTransacao(fakeRepo(), { ...base, amountCents });
      expect(r.ok).toBe(false);
    }
  });
  it('rejeita data inválida', async () => {
    const r = await criarTransacao(fakeRepo(), { ...base, occurredOn: '2026-02-30' });
    expect(r.ok).toBe(false);
  });
  it('reenvio com o mesmo clientId é idempotente', async () => {
    const repo = fakeRepo();
    await criarTransacao(repo, base);
    await criarTransacao(repo, base);
    expect(repo.rows.size).toBe(1);
  });
  it('edita, exclui e desfaz', async () => {
    const repo = fakeRepo();
    const c = await criarTransacao(repo, base);
    if (!c.ok) throw new Error('falhou');
    const e = await editarTransacao(repo, c.value.id, {
      walletId: 'w1',
      categoryId: null,
      amountCents: 5000,
      occurredOn: '2026-11-12',
    });
    expect(e.ok && e.value.amountCents).toBe(5000);
    await excluirTransacao(repo, relogioFixo('2026-11-12'), c.value.id);
    expect(repo.rows.get(c.value.id)?.deletedAt).not.toBeNull();
    await desfazerExclusao(repo, c.value.id);
    expect(repo.rows.get(c.value.id)?.deletedAt).toBeNull();
  });
  it('editar inexistente devolve erro', async () => {
    const r = await editarTransacao(fakeRepo(), 'x', {
      walletId: 'w',
      categoryId: null,
      amountCents: 1,
      occurredOn: '2026-11-12',
    });
    expect(r.ok).toBe(false);
  });
  it('importa em lote, ignora repetidos e conta inválidos', async () => {
    const repo = fakeRepo();
    const lote = [
      { ...base, clientId: 'a' },
      { ...base, clientId: 'b' },
      { ...base, clientId: 'c', amountCents: 0 },
    ];
    expect(await importarLancamentos(repo, lote)).toEqual({ criados: 2, repetidos: 0, invalidos: 1 });
    expect(await importarLancamentos(repo, lote)).toEqual({ criados: 0, repetidos: 2, invalidos: 1 });
  });
});
