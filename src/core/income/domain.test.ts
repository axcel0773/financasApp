import { describe, expect, it } from 'vitest';
import { gerarPrevistos, type FonteRenda } from './domain';

const fonte = (o: Partial<FonteRenda> = {}): FonteRenda => ({
  id: 's1',
  kind: 'salary',
  name: 'CLT',
  employer: null,
  grossCents: 1_000_000,
  advancePercent: 40,
  advanceDay: 20,
  finalDay: 5,
  walletId: null,
  active: true,
  dependents: 0,
  alimonyCents: 0,
  ...o,
});
const holerite = {
  grossCents: 1_000_000,
  inssCents: 98_810,
  irrfCents: 156_954,
  netCents: 744_236,
};

describe('previstos de renda', () => {
  it('gera adiantamento no mês e pagamento final no mês seguinte', () => {
    const p = gerarPrevistos(fonte(), '2026-11', holerite);
    expect(p.map((x) => [x.kind, x.expectedOn, x.expectedNetCents])).toEqual([
      ['advance', '2026-11-20', 400_000],
      ['final', '2026-12-05', 344_236],
    ]);
  });
  it('sem datas cadastradas não gera nada', () => {
    expect(
      gerarPrevistos(fonte({ advanceDay: null, finalDay: null }), '2026-11', holerite),
    ).toEqual([]);
  });
  it('fonte inativa ou que não é salário não gera', () => {
    expect(gerarPrevistos(fonte({ active: false }), '2026-11', holerite)).toEqual([]);
    expect(gerarPrevistos(fonte({ kind: 'plr' }), '2026-11', holerite)).toEqual([]);
  });
});
