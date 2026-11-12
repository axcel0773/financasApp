import { describe, expect, it } from 'vitest';
import { chaveOcorrencia, ocorrenciasPendentes, type RegraFixa } from './domain';

const regra = (o: Partial<RegraFixa> = {}): RegraFixa => ({
  id: 'r1',
  name: 'Aluguel',
  dayOfMonth: 31,
  amountCents: 200_000,
  categoryId: null,
  walletId: 'w',
  active: true,
  startOn: '2026-01-01',
  ...o,
});
describe('recorrências', () => {
  it('gera uma ocorrência com o dia limitado ao mês', () => {
    expect(ocorrenciasPendentes([regra()], '2026-02', new Set())[0]?.date).toBe('2026-02-28');
  });
  it('é idempotente', () => {
    const ja = new Set([chaveOcorrencia('r1', '2026-02-28')]);
    expect(ocorrenciasPendentes([regra()], '2026-02', ja)).toHaveLength(0);
  });
  it('ignora regra inativa ou que ainda não começou', () => {
    expect(ocorrenciasPendentes([regra({ active: false })], '2026-02', new Set())).toHaveLength(0);
    expect(
      ocorrenciasPendentes([regra({ startOn: '2026-03-01' })], '2026-02', new Set()),
    ).toHaveLength(0);
  });
});
