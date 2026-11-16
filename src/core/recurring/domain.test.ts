import { describe, expect, it } from 'vitest';
import { chaveOcorrencia, ocorrenciasPendentes, proximoFixo, restanteDoParcelamento, type RegraFixa } from './domain';

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


describe('próximo fixo', () => {
  const r = (id: string, dayOfMonth: number, active = true) => regra({ id, dayOfMonth, active });
  it('o de dia mais próximo a partir de hoje (hoje conta)', () => {
    expect(proximoFixo([r('a', 20), r('b', 16), r('c', 3)], '2026-11-16')).toEqual({ regra: expect.objectContaining({ id: 'b' }), date: '2026-11-16' });
  });
  it('se todos já passaram, o primeiro do mês seguinte (com virada de ano)', () => {
    expect(proximoFixo([r('a', 5), r('b', 3)], '2026-12-20')?.date).toBe('2027-01-03');
  });
  it('dia 31 em novembro cai no dia 30', () => {
    expect(proximoFixo([r('a', 31)], '2026-11-16')?.date).toBe('2026-11-30');
  });
  it('ignora pausados; sem ativos, null', () => {
    expect(proximoFixo([r('a', 20, false)], '2026-11-16')).toBeNull();
  });
});

describe('restante do parcelamento', () => {
  it('usa as parcelas exatas: o resto dos centavos está na 1ª', () => {
    // 100,00 em 3: 33,34 + 33,33 + 33,33
    expect(restanteDoParcelamento(10_000, 3, 0)).toBe(10_000);
    expect(restanteDoParcelamento(10_000, 3, 1)).toBe(6_666);
    expect(restanteDoParcelamento(10_000, 3, 3)).toBe(0);
  });
  it('pagas fora do intervalo não quebram a conta', () => {
    expect(restanteDoParcelamento(10_000, 3, 5)).toBe(0);
    expect(restanteDoParcelamento(10_000, 3, -1)).toBe(10_000);
  });
});
