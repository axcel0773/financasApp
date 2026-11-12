import { describe, expect, it } from 'vitest';
import { chaveOcorrencia, type OcorrenciaFixa, type RegraFixa } from './domain';
import type { RecurringRepository } from './ports';
import { criarParcelamento, gerarFixosDoMes } from './application';

function fake(regras: RegraFixa[]) {
  const geradas = new Set<string>();
  const planos: number[] = [];
  const repo: RecurringRepository = {
    regras: async () => regras,
    salvarRegra: async () => {},
    chavesGeradas: async () => new Set(geradas),
    gerar: async (o: OcorrenciaFixa[]) => {
      o.forEach((x) => geradas.add(chaveOcorrencia(x.ruleId, x.date)));
      return o.length;
    },
    planos: async () => [],
    criarPlano: async (_p, parcelas) => {
      planos.push(parcelas.length);
    },
  };
  return { repo, geradas, planos };
}
const regra: RegraFixa = {
  id: 'r1',
  name: 'Aluguel',
  dayOfMonth: 10,
  amountCents: 100_000,
  categoryId: null,
  walletId: 'w',
  active: true,
  startOn: '2026-01-01',
};

describe('casos de uso de fixos e parcelas', () => {
  it('gera os fixos uma única vez por mês', async () => {
    const { repo, geradas } = fake([regra]);
    expect(await gerarFixosDoMes(repo, '2026-11')).toBe(1);
    expect(await gerarFixosDoMes(repo, '2026-11')).toBe(0);
    expect(geradas.size).toBe(1);
  });
  it('cria parcelamento válido', async () => {
    const { repo, planos } = fake([]);
    const r = await criarParcelamento(repo, {
      description: 'TV',
      totalCents: 300_000,
      installments: 10,
      firstOn: '2026-11-12',
      categoryId: null,
      walletId: 'w',
    });
    expect(r.ok && r.value).toBe(10);
    expect(planos).toEqual([10]);
  });
  it('rejeita parcelamento inválido', async () => {
    const { repo } = fake([]);
    for (const p of [
      { totalCents: 0, installments: 3 },
      { totalCents: 100, installments: 1 },
      { totalCents: 100, installments: 3, firstOn: '2026-13-01' },
    ]) {
      const r = await criarParcelamento(repo, {
        description: 'x',
        firstOn: '2026-11-12',
        categoryId: null,
        walletId: 'w',
        ...p,
      });
      expect(r.ok).toBe(false);
    }
  });
});
