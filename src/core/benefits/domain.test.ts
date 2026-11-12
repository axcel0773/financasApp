import { describe, expect, it } from 'vitest';
import { proximoCredito, resumirBeneficio } from './domain';

describe('VR/VA', () => {
  it('calcula disponível por dia, média e sobra projetada', () => {
    const r = resumirBeneficio({
      saldoCents: 60_000,
      hoje: '2026-11-12',
      proximoCredito: '2026-12-02',
      gastoNoPeriodoCents: 24_000,
      diasDecorridos: 12,
    });
    expect(r.diasAteCredito).toBe(20);
    expect(r.disponivelPorDiaCents).toBe(3_000);
    expect(r.mediaDiariaCents).toBe(2_000);
    expect(r.sobraProjetadaCents).toBe(20_000);
  });
  it('sobra negativa quando o ritmo estoura o saldo', () => {
    const r = resumirBeneficio({
      saldoCents: 10_000,
      hoje: '2026-11-12',
      proximoCredito: '2026-11-22',
      gastoNoPeriodoCents: 30_000,
      diasDecorridos: 10,
    });
    expect(r.sobraProjetadaCents).toBe(-20_000);
  });
  it('crédito hoje ou no passado conta 1 dia (sem divisão por zero)', () => {
    expect(
      resumirBeneficio({
        saldoCents: 5_000,
        hoje: '2026-11-12',
        proximoCredito: '2026-11-12',
        gastoNoPeriodoCents: 0,
        diasDecorridos: 0,
      }).diasAteCredito,
    ).toBe(1);
  });
});

describe('próximo crédito', () => {
  it('mesmo dia no mês corrente se ainda não passou', () =>
    expect(proximoCredito('2026-10-05', '2026-11-03')).toBe('2026-11-05'));
  it('no mês seguinte se já passou', () =>
    expect(proximoCredito('2026-10-05', '2026-11-12')).toBe('2026-12-05'));
  it('hoje conta como ainda não passou', () =>
    expect(proximoCredito('2026-10-05', '2026-11-05')).toBe('2026-11-05'));
  it('dia 31 limitado ao fim do mês', () =>
    expect(proximoCredito('2026-01-31', '2026-02-10')).toBe('2026-02-28'));
});
