import { describe, expect, it } from 'vitest';
import { estadoViagem, resumirViagem, validarViagem, type Viagem } from './domain';

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
