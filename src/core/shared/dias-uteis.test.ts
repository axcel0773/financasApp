import { describe, expect, it } from 'vitest';
import { ehDiaUtil, enesimoDiaUtil, pascoa, ultimoDiaUtil } from './dias-uteis';

describe('dias úteis', () => {
  it('calcula a Páscoa', () => {
    expect(pascoa(2024)).toBe('2024-03-31');
    expect(pascoa(2026)).toBe('2026-04-05');
    expect(pascoa(2027)).toBe('2027-03-28');
  });
  it('fim de semana e feriado nacional não são dias úteis', () => {
    expect(ehDiaUtil('2026-11-14')).toBe(false); // sábado
    expect(ehDiaUtil('2026-11-20')).toBe(false); // Consciência Negra
    expect(ehDiaUtil('2026-04-03')).toBe(false); // Sexta-feira Santa
    expect(ehDiaUtil('2026-11-16')).toBe(true);
  });
  it('último dia útil do mês', () => {
    expect(ultimoDiaUtil('2026-11')).toBe('2026-11-30'); // segunda
    expect(ultimoDiaUtil('2026-05')).toBe('2026-05-29'); // 31 é domingo
    expect(ultimoDiaUtil('2024-03')).toBe('2024-03-28'); // 29 é Sexta-feira Santa, 30 e 31 fim de semana
    expect(ultimoDiaUtil('2026-12')).toBe('2026-12-31');
  });
  it('quinto dia útil do mês', () => {
    expect(enesimoDiaUtil('2026-12', 5)).toBe('2026-12-07');
    expect(enesimoDiaUtil('2027-01', 5)).toBe('2027-01-08'); // 1º é feriado
    expect(enesimoDiaUtil('2026-11', 1)).toBe('2026-11-03'); // 1º domingo, 2 Finados
  });
});
