import { describe, expect, it } from 'vitest';
import { tabelaDesatualizada, validarFaixas } from './tabelas';

const f = (up: number | null, rate = 0.1) => ({ upToCents: up, rate, deductionCents: 0 });
describe('tabelas de imposto', () => {
  it('aceita faixas crescentes', () => expect(validarFaixas([f(100), f(200), f(null)], { ultimaSemTeto: true })).toBeNull());
  it('recusa limites fora de ordem', () => expect(validarFaixas([f(200), f(100)], { ultimaSemTeto: false })).not.toBeNull());
  it('recusa alíquota acima de 100%', () => expect(validarFaixas([f(100, 1.5)], { ultimaSemTeto: false })).not.toBeNull());
  it('IRRF exige última faixa sem teto', () => expect(validarFaixas([f(100), f(200)], { ultimaSemTeto: true })).not.toBeNull());
  it('sem teto só na última', () => expect(validarFaixas([f(null), f(100)], { ultimaSemTeto: false })).not.toBeNull());
  it('vigência de ano anterior é desatualizada', () => {
    expect(tabelaDesatualizada('2025-01-01', '2026-11-12')).toBe(true);
    expect(tabelaDesatualizada('2026-01-01', '2026-11-12')).toBe(false);
  });
});
