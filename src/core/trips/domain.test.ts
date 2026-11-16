import { describe, expect, it } from 'vitest';
import { estadoViagem, resumirViagem, validarViagem, viagensParaLancar, type Viagem } from './domain';

const v: Viagem = { id: 'v1', name: 'Floripa', startOn: '2026-11-10', endOn: '2026-11-14', budgetCents: 300000, people: 2 };

describe('validarViagem', () => {
  it('aceita e apara o nome', () => {
    const r = validarViagem({ ...v, name: '  Floripa ' });
    expect(r.ok && r.value.name).toBe('Floripa');
  });
  it('rejeita volta antes da ida, nome vazio, pessoas e orçamento inválidos', () => {
    expect(validarViagem({ ...v, endOn: '2026-11-09' }).ok).toBe(false);
    expect(validarViagem({ ...v, name: ' ' }).ok).toBe(false);
    expect(validarViagem({ ...v, people: 0 }).ok).toBe(false);
    expect(validarViagem({ ...v, budgetCents: -1 }).ok).toBe(false);
  });
});

describe('viagem com volta em aberto', () => {
  const aberta: Viagem = { ...v, endOn: null };
  it('é válida sem data de volta', () => {
    expect(validarViagem(aberta).ok).toBe(true);
  });
  it('fica em andamento depois da ida, sem nunca concluir sozinha', () => {
    expect(estadoViagem(aberta, '2026-11-09')).toBe('planejada');
    expect(estadoViagem(aberta, '2027-03-01')).toBe('andamento');
  });
  it('resume sem total de dias e sem "pode gastar por dia"', () => {
    const r = resumirViagem(aberta, [{ categoryId: 'a', cents: 100000 }], '2026-11-12');
    expect(r).toMatchObject({ diasTotal: null, diasRestantes: null, diaAtual: 3, podeGastarPorDiaCents: null });
  });
});

describe('estadoViagem', () => {
  it('separa planejada, em andamento e concluída', () => {
    expect(estadoViagem(v, '2026-11-09')).toBe('planejada');
    expect(estadoViagem(v, '2026-11-10')).toBe('andamento');
    expect(estadoViagem(v, '2026-11-14')).toBe('andamento');
    expect(estadoViagem(v, '2026-11-15')).toBe('concluida');
  });
});

describe('resumirViagem', () => {
  const gastos = [
    { categoryId: 'h', cents: 78000 },
    { categoryId: 'a', cents: 52000 },
    { categoryId: 'a', cents: 56000 },
  ];
  it('calcula total, uso do orçamento, média e quanto pode gastar por dia', () => {
    const r = resumirViagem(v, gastos, '2026-11-12');
    expect(r.totalCents).toBe(186000);
    expect(r.usadoPct).toBe(62);
    expect(r.restanteCents).toBe(114000);
    expect(r).toMatchObject({ diasTotal: 5, diaAtual: 3, diasRestantes: 2, mediaPorDiaCents: 62000, podeGastarPorDiaCents: 57000, porPessoaCents: 93000 });
    expect(r.porCategoria[0]).toMatchObject({ categoryId: 'a', cents: 108000 });
  });
  it('sinaliza orçamento estourado', () => {
    const r = resumirViagem(v, [{ categoryId: null, cents: 310000 }], '2026-11-14');
    expect(r.estourou).toBe(true);
    expect(r.podeGastarPorDiaCents).toBeNull();
  });
  it('antes da ida o dia atual é 0 e sem orçamento não há percentual', () => {
    const r = resumirViagem({ ...v, budgetCents: 0 }, [], '2026-11-01');
    expect(r).toMatchObject({ diaAtual: 0, usadoPct: null, restanteCents: null, mediaPorDiaCents: 0 });
  });
});

describe('viagens para lançar', () => {
  const v = (id: string, startOn: string, endOn: string | null): Viagem => ({ id, name: id, startOn, endOn, budgetCents: 0, people: 1 });
  it('esconde as que acabaram há mais de 60 dias e marca a em andamento', () => {
    const r = viagensParaLancar(
      [v('antiga', '2026-01-10', '2026-01-20'), v('sp', '2026-11-10', '2026-11-20'), v('rio', '2026-12-20', null), v('recente', '2026-10-01', '2026-10-05')],
      '2026-11-16',
    );
    expect(r.opcoes.map((o) => o.id)).toEqual(['rio', 'sp', 'recente']);
    expect(r.atual).toBe('sp');
  });
  it('sem viagem em andamento, nada vem marcado', () => {
    expect(viagensParaLancar([v('rio', '2026-12-20', null)], '2026-11-16').atual).toBeNull();
  });
});
