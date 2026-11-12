import { describe, expect, it } from 'vitest';
import { validarTransferencia } from './domain';

const base = { clientId: 'c1', fromWalletId: 'a', toWalletId: 'b', amountCents: 5000, occurredOn: '2026-11-12' };
describe('transferência', () => {
  it('aceita carteiras diferentes e valor positivo', () => expect(validarTransferencia(base).ok).toBe(true));
  it('recusa mesma carteira', () => {
    const r = validarTransferencia({ ...base, toWalletId: 'a' });
    expect(r.ok).toBe(false);
  });
  it('recusa valor zero, negativo ou fracionado', () => {
    for (const v of [0, -1, 10.5]) expect(validarTransferencia({ ...base, amountCents: v }).ok).toBe(false);
  });
  it('recusa data inválida', () => expect(validarTransferencia({ ...base, occurredOn: '2026-13-40' }).ok).toBe(false));
  it('limpa a nota vazia', () => {
    const r = validarTransferencia({ ...base, note: '   ' });
    expect(r.ok && r.value.note).toBeNull();
  });
});
