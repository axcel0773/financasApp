import { describe, expect, it } from 'vitest';
import { calcularSobraDoMes, statusOrcamento } from './domain';

describe('sobra do mês', () => {
  it('ignora gastos pagos com VR/VA', () => {
    const sobra = calcularSobraDoMes(500_000, [
      { walletKind: 'checking', cents: 100_000 },
      { walletKind: 'credit_card', cents: 50_000 },
      { walletKind: 'meal_voucher', cents: 80_000 },
      { walletKind: 'food_voucher', cents: 30_000 },
    ]);
    expect(sobra).toBe(350_000);
  });
});
describe('orçamento', () => {
  it('sem limite', () => expect(statusOrcamento(null, 100).estado).toBe('sem_limite'));
  it('ok abaixo de 90%', () => expect(statusOrcamento(100_000, 89_999).estado).toBe('ok'));
  it('alerta a partir de 90%', () => {
    const s = statusOrcamento(100_000, 90_000);
    expect(s.estado).toBe('alerta');
    expect(s.usadoPct).toBe(90);
    expect(s.restanteCents).toBe(10_000);
  });
  it('estourado acima de 100%', () => {
    const s = statusOrcamento(100_000, 120_000);
    expect(s.estado).toBe('estourado');
    expect(s.restanteCents).toBe(-20_000);
  });
  it('100% exato ainda é alerta', () =>
    expect(statusOrcamento(100_000, 100_000).estado).toBe('alerta'));
});
