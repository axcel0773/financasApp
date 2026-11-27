import { addMeses, competenciaDe, dataNoMes, diffDias, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';
import { semAcento, type LinhaExtrato } from './extrato';

/** "Pagamento recebido" e afins: é a quitação da fatura anterior, não uma receita. */
export function ehPagamentoDaFatura(descricao: string): boolean {
  return /^(pagamento (recebido|de fatura|da fatura|efetuado)|pagto fatura)/.test(semAcento(descricao.trim()));
}

/** Cabeçalho do CSV da fatura do Nubank (`date,title,amount`), em que compra vem positiva. */
export function pareceFaturaDeCartao(texto: string): boolean {
  const primeira = semAcento(texto.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '').replace(/\s/g, '');
  return primeira === 'date,title,amount';
}

export interface PeriodoViagem {
  startOn: IsoDate;
  /** Nulo = viagem sem data de volta (ainda em andamento). */
  endOn: IsoDate | null;
}
export const dentroDaViagem = (data: IsoDate, v: PeriodoViagem): boolean =>
  data >= v.startOn && (v.endOn === null || data <= v.endOn);

export interface LancamentoExistente {
  occurredOn: IsoDate;
  cents: Cents;
  kind: 'expense' | 'income';
  note: string | null;
  /** Veio de um gasto fixo: a data da fatura costuma andar alguns dias. */
  fixo: boolean;
}
export interface FixoAtivo {
  name: string;
  dayOfMonth: number;
  amountCents: Cents;
  startOn: IsoDate;
}

/** Tolerância em dias: lançamento comum 2, gasto fixo 5 (a cobrança no cartão cai depois do dia do fixo). */
const TOL_COMUM = 2;
const TOL_FIXO = 5;

/**
 * Marca as linhas que já parecem lançadas: mesmo valor e tipo, data próxima. Cada lançamento existente
 * (ou ocorrência de fixo) só cobre uma linha, sempre a de data mais próxima. Devolve linha → o que já existe.
 */
export function marcarJaLancados(
  linhas: Pick<LinhaExtrato, 'linha' | 'data' | 'cents' | 'kind'>[],
  existentes: LancamentoExistente[],
  fixos: FixoAtivo[],
): Map<number, string> {
  type Alvo = { data: IsoDate; cents: Cents; kind: 'expense' | 'income'; tol: number; rotulo: string; usado: boolean };
  const alvos: Alvo[] = existentes.map((e) => ({
    data: e.occurredOn,
    cents: e.cents,
    kind: e.kind,
    tol: e.fixo ? TOL_FIXO : TOL_COMUM,
    rotulo: e.note?.trim() || 'lançamento sem descrição',
    usado: false,
  }));
  // Ocorrências de fixo ainda não geradas, nos meses das linhas (e vizinhos, para a virada do mês).
  const meses = new Set<string>();
  for (const l of linhas) {
    const c = competenciaDe(l.data);
    meses.add(addMeses(c, -1)).add(c).add(addMeses(c, 1));
  }
  for (const f of fixos) {
    for (const c of meses) {
      const data = dataNoMes(c, f.dayOfMonth);
      if (data < f.startOn) continue;
      const jaGerado = alvos.some((a) => a.cents === f.amountCents && a.tol === TOL_FIXO && Math.abs(diffDias(a.data, data)) <= TOL_FIXO);
      if (!jaGerado) alvos.push({ data, cents: f.amountCents, kind: 'expense', tol: TOL_FIXO, rotulo: `fixo ${f.name}`, usado: false });
    }
  }
  // Pares candidatos, do mais próximo ao mais distante: cada lado entra uma vez só.
  const pares: { linha: number; alvo: Alvo; dist: number }[] = [];
  for (const l of linhas)
    for (const a of alvos) {
      if (a.cents !== l.cents || a.kind !== l.kind) continue;
      const dist = Math.abs(diffDias(a.data, l.data));
      if (dist <= a.tol) pares.push({ linha: l.linha, alvo: a, dist });
    }
  pares.sort((x, y) => x.dist - y.dist || x.linha - y.linha);
  const out = new Map<number, string>();
  for (const p of pares) {
    if (out.has(p.linha) || p.alvo.usado) continue;
    p.alvo.usado = true;
    out.set(p.linha, p.alvo.rotulo);
  }
  return out;
}

/** Palavras comuns em faturas de cartão e as categorias que costumam receber (pelo nome, sem acento). */
const CATALOGO: { keyword: string; categorias: string[] }[] = [
  { keyword: 'uber', categorias: ['transporte'] },
  { keyword: '99 ride', categorias: ['transporte'] },
  { keyword: 'estacionamento', categorias: ['transporte'] },
  { keyword: 'gol linhas', categorias: ['viagem', 'viagens', 'transporte'] },
  { keyword: 'latam', categorias: ['viagem', 'viagens', 'transporte'] },
  { keyword: 'azul linhas', categorias: ['viagem', 'viagens', 'transporte'] },
  { keyword: 'passage', categorias: ['viagem', 'viagens', 'transporte'] },
  { keyword: 'ifood', categorias: ['restaurantes', 'alimentacao'] },
  { keyword: 'ifd*', categorias: ['restaurantes', 'alimentacao'] },
  { keyword: 'restaura', categorias: ['restaurantes', 'alimentacao'] },
  { keyword: 'outback', categorias: ['restaurantes', 'alimentacao'] },
  { keyword: 'drogaria', categorias: ['saude', 'farmacia'] },
  { keyword: 'farma', categorias: ['saude', 'farmacia'] },
  { keyword: 'droga raia', categorias: ['saude', 'farmacia'] },
  { keyword: 'airbnb', categorias: ['hospedagem', 'viagem', 'viagens', 'lazer'] },
  { keyword: 'booking', categorias: ['hospedagem', 'viagem', 'viagens', 'lazer'] },
  { keyword: 'hotel', categorias: ['hospedagem', 'viagem', 'viagens', 'lazer'] },
  { keyword: 'supermercado', categorias: ['mercado'] },
  { keyword: 'spotify', categorias: ['assinaturas'] },
  { keyword: 'netflix', categorias: ['assinaturas'] },
  { keyword: 'google*one', categorias: ['assinaturas'] },
];

export interface RegraSugerida {
  keyword: string;
  categoryId: string;
  categoria: string;
  /** Quantas linhas do arquivo a regra pegaria. */
  linhas: number;
}

/**
 * Sugere regras do catálogo que pegam alguma linha do arquivo, desde que nenhuma regra salva já cubra
 * essas linhas e que exista uma categoria com um dos nomes esperados.
 */
export function sugerirRegras(
  descricoes: string[],
  regras: { keyword: string }[],
  categorias: { id: string; nome: string }[],
): RegraSugerida[] {
  const porNome = new Map(categorias.map((c) => [semAcento(c.nome.trim()), c]));
  const salvas = regras.map((r) => semAcento(r.keyword.trim())).filter(Boolean);
  const descs = descricoes.map(semAcento);
  const out: RegraSugerida[] = [];
  for (const item of CATALOGO) {
    const cat = item.categorias.map((n) => porNome.get(n)).find((c) => c !== undefined);
    if (!cat) continue;
    const pegas = descs.filter((d) => d.includes(item.keyword) && !salvas.some((k) => d.includes(k)));
    if (pegas.length === 0) continue;
    out.push({ keyword: item.keyword, categoryId: cat.id, categoria: cat.nome, linhas: pegas.length });
  }
  return out;
}
