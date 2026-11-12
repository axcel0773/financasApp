import { describe, expect, it } from 'vitest';
import { projetarSaldo } from './domain';

describe('fluxo de caixa', () => {
  const eventos = [
    { date: '2026-11-20', cents: 400_000, label: 'Adiantamento' },
    { date: '2026-11-15', cents: -150_000, label: 'Aluguel' },
    { date: '2026-11-15', cents: -30_000, label: 'Internet' },
    { date: '2026-12-31', cents: -999, label: 'fora do período' },
  ];
  it('acumula por data e agrupa o mesmo dia', () => {
    const p = projetarSaldo(100_000, '2026-11-12', '2026-11-30', eventos, 0);
    expect(p.pontos).toEqual([
      { date: '2026-11-12', saldoCents: 100_000 },
      { date: '2026-11-15', saldoCents: -80_000 },
      { date: '2026-11-20', saldoCents: 320_000 },
    ]);
  });
  it('menor saldo e alerta', () => {
    const p = projetarSaldo(100_000, '2026-11-12', '2026-11-30', eventos, 0);
    expect(p.menorSaldo).toEqual({ date: '2026-11-15', saldoCents: -80_000 });
    expect(p.alerta).toBe(true);
  });
  it('sem alerta quando o mínimo é respeitado', () => {
    expect(projetarSaldo(500_000, '2026-11-12', '2026-11-30', eventos, 100_000).alerta).toBe(false);
  });
});
