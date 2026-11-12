import { describe, expect, it } from 'vitest';
import { gerarAvisos, type EntradaAvisos } from './domain';

const vazio: EntradaAvisos = { hoje: '2026-11-12', beneficios: [], orcamentos: [], contas: [], validadeTabela: null, saldoAbaixoDoMinimo: null };
describe('avisos', () => {
  it('sem motivo, sem avisos', () => expect(gerarAvisos(vazio)).toEqual([]));
  it('conta só avisa dentro de 3 dias', () => {
    const r = gerarAvisos({ ...vazio, contas: [{ nome: 'Aluguel', date: '2026-11-14', amountCents: 150000 }, { nome: 'Internet', date: '2026-11-20', amountCents: 9000 }] });
    expect(r.map((a) => a.titulo)).toEqual(['Aluguel vence em 2 dias']);
  });
  it('conta já vencida não entra', () => expect(gerarAvisos({ ...vazio, contas: [{ nome: 'X', date: '2026-11-10', amountCents: 1 }] })).toEqual([]));
  it('orçamento estourado vem antes do crédito de VR', () => {
    const r = gerarAvisos({ ...vazio, orcamentos: [{ nome: 'Lazer', usadoPct: 120, estado: 'estourado' }], beneficios: [{ nome: 'VR', proximoCredito: '2026-11-13' }] });
    expect(r.map((a) => a.tom)).toEqual(['perigo', 'info']);
    expect(r[1]?.titulo).toBe('VR cai amanhã');
  });
  it('tabela de ano anterior gera aviso', () => expect(gerarAvisos({ ...vazio, validadeTabela: '2025-01-01' })).toHaveLength(1));
  it('saldo abaixo do mínimo é perigo', () => expect(gerarAvisos({ ...vazio, saldoAbaixoDoMinimo: { data: '2026-11-20', saldoCents: -5000 } })[0]?.tom).toBe('perigo'));
});
