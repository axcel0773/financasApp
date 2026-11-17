import { describe, expect, it } from 'vitest';
import { diaDaSemana, feriadosNacionais, melhoresJanelas, pascoa } from './ferias';

describe('Páscoa e feriados', () => {
  it.each([
    [2024, '2024-03-31'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2028, '2028-04-16'],
  ])('Páscoa de %i', (ano, data) => expect(pascoa(ano)).toBe(data));
  it('2027: Carnaval 8 e 9/2, Sexta-feira Santa 26/3, Corpus Christi 27/5', () => {
    const f = new Map(feriadosNacionais(2027).map((x) => [x.nome, x.data]));
    expect(f.get('Carnaval (segunda)')).toBe('2027-02-08');
    expect(f.get('Carnaval (terça)')).toBe('2027-02-09');
    expect(f.get('Sexta-feira Santa')).toBe('2027-03-26');
    expect(f.get('Corpus Christi')).toBe('2027-05-27');
    expect(f.get('Dia da Consciência Negra')).toBe('2027-11-20');
  });
  it('13 datas, só Carnaval e Corpus Christi facultativos', () => {
    const f = feriadosNacionais(2026);
    expect(f).toHaveLength(13);
    expect(f.filter((x) => x.facultativo).map((x) => x.nome)).toEqual(['Carnaval (segunda)', 'Carnaval (terça)', 'Corpus Christi']);
  });
});

describe('melhores datas de férias', () => {
  const j = melhoresJanelas({ ano: 2027, dias: 10, feriados: feriadosNacionais(2027), comFacultativos: true, limite: 3 });
  it('a melhor janela de 10 dias em 2027 cola no Carnaval e rende 16 dias', () => {
    expect(j[0]).toMatchObject({ inicio: '2027-02-10', fim: '2027-02-19', folgaInicio: '2027-02-06', folgaFim: '2027-02-21', diasDeFolga: 16, ganho: 6 });
  });
  it('nunca começa sexta, sábado, domingo ou nos dois dias antes de feriado', () => {
    const todas = melhoresJanelas({ ano: 2027, dias: 5, feriados: feriadosNacionais(2027), comFacultativos: false, limite: 40 });
    const datas = new Set(feriadosNacionais(2027).filter((f) => !f.facultativo).map((f) => f.data));
    for (const x of todas) {
      expect([1, 2, 3, 4]).toContain(diaDaSemana(x.inicio));
      const d = new Date(`${x.inicio}T00:00:00Z`);
      for (const k of [0, 1, 2]) expect(datas.has(new Date(d.getTime() + k * 86_400_000).toISOString().slice(0, 10))).toBe(false);
    }
  });
  it('janelas sugeridas não se sobrepõem', () => {
    for (let a = 0; a < j.length; a++)
      for (let b = a + 1; b < j.length; b++)
        expect(j[a]!.folgaFim < j[b]!.folgaInicio || j[b]!.folgaFim < j[a]!.folgaInicio).toBe(true);
  });
  it('sem facultativos, o Carnaval não conta', () => {
    const s = melhoresJanelas({ ano: 2027, dias: 10, feriados: feriadosNacionais(2027), comFacultativos: false, limite: 5 });
    expect(s.every((x) => !x.feriados.some((n) => n.startsWith('Carnaval')))).toBe(true);
  });
  it('respeita a data mínima de início', () => {
    const s = melhoresJanelas({ ano: 2027, dias: 10, feriados: feriadosNacionais(2027), comFacultativos: true, aPartirDe: '2027-06-01' });
    expect(s.every((x) => x.inicio >= '2027-06-01')).toBe(true);
  });
});
