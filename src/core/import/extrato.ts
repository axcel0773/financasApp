import { isIsoDate, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface LinhaExtrato {
  linha: number;
  data: IsoDate;
  descricao: string;
  cents: Cents;
  kind: 'expense' | 'income';
}
export interface ResultadoExtrato {
  linhas: LinhaExtrato[];
  erros: { linha: number; motivo: string }[];
}

const semAcento = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Divide uma linha respeitando aspas ("a;b" fica numa célula só). */
export function dividirLinha(linha: string, sep: string): string[] {
  const out: string[] = [];
  let atual = '';
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i]!;
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') { atual += '"'; i++; } else aspas = !aspas;
    } else if (ch === sep && !aspas) { out.push(atual.trim()); atual = ''; } else atual += ch;
  }
  out.push(atual.trim());
  return out;
}

export function parseData(s: string): IsoDate | null {
  const t = s.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return isIsoDate(`${m[1]}-${m[2]}-${m[3]}`) ? `${m[1]}-${m[2]}-${m[3]}` : null;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(t);
  if (!m) return null;
  const ano = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
  const iso = `${ano}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  return isIsoDate(iso) ? iso : null;
}

/** Aceita "1.234,56", "-1234,56", "1234.56", "R$ 12,00" e "(12,00)" (negativo). Devolve centavos com sinal. */
export function parseValor(s: string): Cents | null {
  let t = s.replace(/R\$|\s/g, '');
  if (t === '') return null;
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  if (t.startsWith('-')) { neg = true; t = t.slice(1); } else if (t.startsWith('+')) t = t.slice(1);
  if (t.endsWith('-')) { neg = true; t = t.slice(0, -1); }
  if (!/^[\d.,]+$/.test(t)) return null;
  const virgula = t.lastIndexOf(','), ponto = t.lastIndexOf('.');
  if (virgula >= 0 && ponto >= 0) t = virgula > ponto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (virgula >= 0) t = t.replace(/\./g, '').replace(',', '.');
  else if ((t.match(/\./g) ?? []).length > 1) t = t.replace(/\./g, '');
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return neg ? -cents : cents;
}

/**
 * Lê um extrato CSV (separador `;`, `,` ou tab). Reconhece colunas pelo cabeçalho (data, descrição/histórico, valor)
 * ou assume a ordem data, descrição, valor. Valor negativo é gasto; positivo é receita
 * (use `positivoEhGasto` para faturas de cartão, em que a compra vem positiva).
 */
export function lerExtrato(texto: string, opcoes: { positivoEhGasto?: boolean } = {}): ResultadoExtrato {
  const brutas = texto.replace(/^﻿/, '').split(/\r?\n/);
  const linhasNaoVazias = brutas.map((l, i) => ({ l, n: i + 1 })).filter((x) => x.l.trim() !== '');
  const resultado: ResultadoExtrato = { linhas: [], erros: [] };
  if (linhasNaoVazias.length === 0) return resultado;

  const amostra = linhasNaoVazias[0]!.l;
  const sep = [';', '\t', ','].reduce((a, b) => (amostra.split(b).length > amostra.split(a).length ? b : a), ';');
  const cab = dividirLinha(amostra, sep).map(semAcento);
  const achar = (re: RegExp) => cab.findIndex((c) => re.test(c));
  const temCabecalho = parseData(cab[0] ?? '') === null && achar(/data|date/) >= 0;
  const iData = temCabecalho ? achar(/data|date/) : 0;
  const iDesc = temCabecalho ? achar(/descri|hist|lancamento|estabelecimento|memo|title/) : 1;
  const iValor = temCabecalho ? achar(/valor|amount|quantia/) : 2;
  if (iData < 0 || iValor < 0) {
    resultado.erros.push({ linha: linhasNaoVazias[0]!.n, motivo: 'Não encontrei as colunas de data e valor.' });
    return resultado;
  }
  for (const { l, n } of linhasNaoVazias.slice(temCabecalho ? 1 : 0)) {
    const c = dividirLinha(l, sep);
    const data = parseData(c[iData] ?? '');
    const valor = parseValor(c[iValor] ?? '');
    if (!data) { resultado.erros.push({ linha: n, motivo: 'Data inválida.' }); continue; }
    if (valor === null || valor === 0) { resultado.erros.push({ linha: n, motivo: 'Valor inválido.' }); continue; }
    const gasto = opcoes.positivoEhGasto ? valor > 0 : valor < 0;
    resultado.linhas.push({
      linha: n, data, descricao: (iDesc >= 0 ? c[iDesc] ?? '' : '').slice(0, 200) || 'Importado',
      cents: Math.abs(valor), kind: gasto ? 'expense' : 'income',
    });
  }
  return resultado;
}

/** Sugere a categoria: vence a palavra-chave mais longa contida na descrição (sem acento, sem caixa). */
export function categorizar(descricao: string, regras: { keyword: string; categoryId: string }[]): string | null {
  const d = semAcento(descricao);
  let melhor: { len: number; id: string } | null = null;
  for (const r of regras) {
    const k = semAcento(r.keyword.trim());
    if (k && d.includes(k) && (!melhor || k.length > melhor.len)) melhor = { len: k.length, id: r.categoryId };
  }
  return melhor?.id ?? null;
}
