import { describe, expect, it } from 'vitest';
import { categorizar, lerExtrato, parseData, parseValor } from './extrato';

describe('valores e datas de extrato', () => {
  it('lê valores em vários formatos', () => {
    expect(parseValor('1.234,56')).toBe(123456);
    expect(parseValor('-12,5')).toBe(-1250);
    expect(parseValor('R$ 99,90')).toBe(9990);
    expect(parseValor('1234.56')).toBe(123456);
    expect(parseValor('1,234.56')).toBe(123456);
    expect(parseValor('(15,00)')).toBe(-1500);
    expect(parseValor('abc')).toBeNull();
  });
  it('lê datas BR e ISO', () => {
    expect(parseData('05/11/2026')).toBe('2026-11-05');
    expect(parseData('5-1-26')).toBe('2026-01-05');
    expect(parseData('2026-11-05')).toBe('2026-11-05');
    expect(parseData('31/02/2026')).toBeNull();
  });
});
describe('lerExtrato', () => {
  it('usa o cabeçalho e o sinal do valor', () => {
    const r = lerExtrato('Data;Histórico;Valor\n05/11/2026;PIX Mercado;-45,90\n06/11/2026;Salário;5.000,00');
    expect(r.erros).toEqual([]);
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas[0]).toMatchObject({ data: '2026-11-05', cents: 4590, kind: 'expense', descricao: 'PIX Mercado' });
    expect(r.linhas[1]).toMatchObject({ cents: 500000, kind: 'income' });
  });
  it('sem cabeçalho assume data, descrição e valor', () => {
    const r = lerExtrato('05/11/2026,Padaria,-12.30');
    expect(r.linhas[0]).toMatchObject({ cents: 1230, kind: 'expense' });
  });
  it('fatura de cartão: positivo é gasto', () => {
    const r = lerExtrato('date,title,amount\n2026-11-05,Uber,23.50', { positivoEhGasto: true });
    expect(r.linhas[0]).toMatchObject({ cents: 2350, kind: 'expense' });
  });
  it('relata linhas ruins com o número da linha', () => {
    const r = lerExtrato('data;descricao;valor\nxx;a;1,00\n05/11/2026;b;0');
    expect(r.linhas).toHaveLength(0);
    expect(r.erros.map((e) => e.linha)).toEqual([2, 3]);
  });
  it('aspas protegem o separador', () => {
    const r = lerExtrato('data;descricao;valor\n05/11/2026;"Loja; matriz";-10,00');
    expect(r.linhas[0]?.descricao).toBe('Loja; matriz');
  });
});
describe('categorizar', () => {
  const regras = [{ keyword: 'uber', categoryId: 'transp' }, { keyword: 'uber eats', categoryId: 'comida' }];
  it('vence a palavra-chave mais longa', () => expect(categorizar('UBER EATS *PEDIDO', regras)).toBe('comida'));
  it('ignora acento e caixa', () => expect(categorizar('Pão de Açúcar', [{ keyword: 'pao de acucar', categoryId: 'm' }])).toBe('m'));
  it('sem regra devolve null', () => expect(categorizar('Netflix', regras)).toBeNull());
});
