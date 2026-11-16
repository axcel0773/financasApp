import { describe, expect, it } from 'vitest';
import { dataDoPagamentoFinal, gerarPrevistos, proximoRecebimento, temDatas, type FonteRenda, type Recebimento } from './domain';

const fonte = (o: Partial<FonteRenda> = {}): FonteRenda => ({
  id: 's1',
  kind: 'salary',
  name: 'CLT',
  employer: null,
  grossCents: 1_000_000,
  advancePercent: 40,
  advanceDay: 20,
  finalDay: 5,
  finalRule: 'dia',
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


describe('próximo recebimento', () => {
  const rec = (id: string, expectedOn: string | null, receivedOn: string | null = null): Recebimento => ({
    id, sourceId: 's1', kind: 'final', competencia: '2026-11', expectedOn, expectedNetCents: 100, receivedOn,
    grossCents: null, deductionsCents: 0, netCents: null, walletId: null, note: null,
  });
  it('o previsto mais próximo, de hoje em diante, ainda não recebido', () => {
    const r = proximoRecebimento([rec('a', '2026-11-30'), rec('b', '2026-11-20'), rec('c', '2026-11-10'), rec('d', '2026-11-18', '2026-11-16')], '2026-11-16');
    expect(r?.id).toBe('b');
  });
  it('previsto para hoje conta; sem data ou já recebido, não', () => {
    expect(proximoRecebimento([rec('a', '2026-11-16')], '2026-11-16')?.id).toBe('a');
    expect(proximoRecebimento([rec('a', null), rec('b', '2026-11-20', '2026-11-15')], '2026-11-16')).toBeNull();
  });
});

describe('regra do pagamento final', () => {
  it('último dia útil cai no próprio mês de referência', () => {
    const p = gerarPrevistos(fonte({ finalRule: 'ultimo_dia_util', finalDay: null }), '2026-05', holerite);
    expect(p.find((x) => x.kind === 'final')?.expectedOn).toBe('2026-05-29');
  });
  it('5º dia útil cai no mês seguinte', () => {
    const p = gerarPrevistos(fonte({ finalRule: 'quinto_dia_util', finalDay: null }), '2026-11', holerite);
    expect(p.find((x) => x.kind === 'final')?.expectedOn).toBe('2026-12-07');
  });
  it('dia fixo continua no mês seguinte', () => {
    expect(dataDoPagamentoFinal({ finalRule: 'dia', finalDay: 5 }, '2026-11')).toBe('2026-12-05');
    expect(dataDoPagamentoFinal({ finalRule: 'dia', finalDay: null }, '2026-11')).toBeNull();
  });
  it('temDatas considera a regra', () => {
    expect(temDatas({ advanceDay: null, finalDay: null, finalRule: 'ultimo_dia_util' })).toBe(true);
    expect(temDatas({ advanceDay: null, finalDay: null, finalRule: 'dia' })).toBe(false);
  });
});
