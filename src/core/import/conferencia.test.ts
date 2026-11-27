import { describe, expect, it } from 'vitest';
import { dentroDaViagem, ehPagamentoDaFatura, marcarJaLancados, pareceFaturaDeCartao, sugerirRegras } from './conferencia';

describe('conferência da importação', () => {
  it('reconhece o pagamento da fatura', () => {
    expect(ehPagamentoDaFatura('Pagamento recebido')).toBe(true);
    expect(ehPagamentoDaFatura('PAGAMENTO DE FATURA')).toBe(true);
    expect(ehPagamentoDaFatura('Crédito de "GOL LINHAS" (Gol)')).toBe(false);
    expect(ehPagamentoDaFatura('Mp *Assistenciat - Parcela 1/2')).toBe(false);
  });
  it('reconhece o CSV da fatura do Nubank', () => {
    expect(pareceFaturaDeCartao('date,title,amount\n2026-11-27,X,"1,00"')).toBe(true);
    expect(pareceFaturaDeCartao('﻿date, title, amount\r\n')).toBe(true);
    expect(pareceFaturaDeCartao('Data;Descrição;Valor')).toBe(false);
  });
  it('sabe se a data cai na viagem, inclusive sem volta definida', () => {
    expect(dentroDaViagem('2026-11-08', { startOn: '2026-11-08', endOn: null })).toBe(true);
    expect(dentroDaViagem('2026-11-07', { startOn: '2026-11-08', endOn: null })).toBe(false);
    expect(dentroDaViagem('2026-11-21', { startOn: '2026-11-08', endOn: '2026-11-20' })).toBe(false);
  });

  it('marca o que já foi lançado, cada lançamento cobrindo uma linha só', () => {
    const linhas = [
      { linha: 2, data: '2026-11-09', cents: 300, kind: 'expense' as const },
      { linha: 3, data: '2026-11-14', cents: 5610, kind: 'expense' as const },
      { linha: 4, data: '2026-11-25', cents: 1000, kind: 'expense' as const },
      { linha: 5, data: '2026-11-25', cents: 1000, kind: 'expense' as const },
      { linha: 6, data: '2026-11-20', cents: 5610, kind: 'expense' as const },
    ];
    const existentes = [
      { occurredOn: '2026-11-09', cents: 300, kind: 'expense' as const, note: 'Uber', fixo: false },
      { occurredOn: '2026-11-13', cents: 5610, kind: 'expense' as const, note: 'Almoço ifood', fixo: false },
      { occurredOn: '2026-11-25', cents: 1000, kind: 'expense' as const, note: 'Lavanderia', fixo: false },
    ];
    const m = marcarJaLancados(linhas, existentes, []);
    expect(m.get(2)).toBe('Uber');
    expect(m.get(3)).toBe('Almoço ifood');
    expect([m.has(4), m.has(5)].filter(Boolean)).toHaveLength(1); // duas lavanderias, só uma lançada
    expect(m.has(6)).toBe(false); // 7 dias depois não é o mesmo gasto
  });

  it('reconhece gasto fixo ainda não gerado, com a cobrança alguns dias depois', () => {
    const linhas = [
      { linha: 2, data: '2026-11-19', cents: 2390, kind: 'expense' as const },
      { linha: 3, data: '2026-11-14', cents: 999, kind: 'expense' as const },
      { linha: 4, data: '2026-11-30', cents: 2390, kind: 'expense' as const },
    ];
    const fixos = [
      { name: 'Spotify', dayOfMonth: 18, amountCents: 2390, startOn: '2026-01-01' },
      { name: 'Google one', dayOfMonth: 11, amountCents: 999, startOn: '2026-01-01' },
    ];
    const m = marcarJaLancados(linhas, [], fixos);
    expect(m.get(2)).toBe('fixo Spotify');
    expect(m.get(3)).toBe('fixo Google one');
    expect(m.has(4)).toBe(false);
    // Fixo já gerado como lançamento não vira duas ocorrências.
    const gerado = [{ occurredOn: '2026-11-18', cents: 2390, kind: 'expense' as const, note: 'Spotify', fixo: true }];
    const m2 = marcarJaLancados(linhas, gerado, fixos);
    expect(m2.get(2)).toBe('Spotify');
    expect(m2.has(4)).toBe(false);
  });

  it('sugere regras comuns de cartão só para categorias que existem', () => {
    const cats = [
      { id: 't', nome: 'Transporte' },
      { id: 'r', nome: 'Restaurantes' },
      { id: 's', nome: 'Saúde' },
      { id: 'l', nome: 'Lazer' },
    ];
    const descs = ['Dl *Uberrides', 'Uber Uber *Trip Help.U', 'iFood - NuPay', 'Ultrafarma Popular', 'Airbnb * X', 'Supermercado Best'];
    const s = sugerirRegras(descs, [], cats);
    expect(s.find((x) => x.keyword === 'uber')).toMatchObject({ categoryId: 't', linhas: 2 });
    expect(s.find((x) => x.keyword === 'farma')?.categoryId).toBe('s');
    expect(s.find((x) => x.keyword === 'airbnb')?.categoryId).toBe('l');
    expect(s.some((x) => x.keyword === 'supermercado')).toBe(false); // sem categoria Mercado
    // Uma regra já salva que cobre a linha tira a sugestão.
    expect(sugerirRegras(descs, [{ keyword: 'uber' }], cats).some((x) => x.keyword === 'uber')).toBe(false);
  });
});
