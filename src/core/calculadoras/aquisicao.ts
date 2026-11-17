import type { Cents } from '../shared/money';

export interface EntradaAquisicao {
  horizonteMeses: number;
  /** Quanto o dinheiro rende por ano se ficar aplicado (custo de oportunidade), em %. */
  rendimentoAnualPct: number;
  comprar?: { precoCents: Cents; manutencaoMensalCents: Cents; /** % do preço que se recupera vendendo no fim. */ revendaPct: number };
  alugar?: { mensalCents: Cents; reajusteAnualPct: number };
  assinar?: { mensalCents: Cents };
}

export interface CustoOpcao {
  opcao: 'comprar' | 'alugar' | 'assinar';
  /** Custo em dinheiro de hoje: o que sai, menos o que volta, trazido a valor presente. */
  custoCents: Cents;
  /** Custo por mês de uso (custo ÷ horizonte). */
  porMesCents: Cents;
  /** Soma nominal do que sai do bolso no período (sem descontar a revenda). */
  totalPagoCents: Cents;
}

/** Comprar × alugar × assinar no mesmo horizonte, com o rendimento do dinheiro como custo de oportunidade. */
export function compararAquisicao(e: EntradaAquisicao): { opcoes: CustoOpcao[]; melhor: CustoOpcao['opcao'] | null } {
  const n = Math.max(1, Math.round(e.horizonteMeses));
  const i = (1 + e.rendimentoAnualPct / 100) ** (1 / 12) - 1;
  const vp = (valor: number, mes: number) => valor / (1 + i) ** mes;
  const opcoes: CustoOpcao[] = [];

  if (e.comprar && e.comprar.precoCents > 0) {
    const c = e.comprar;
    let custo = c.precoCents;
    for (let m = 1; m <= n; m++) custo += vp(c.manutencaoMensalCents, m);
    custo -= vp((c.precoCents * Math.min(100, Math.max(0, c.revendaPct))) / 100, n);
    opcoes.push({ opcao: 'comprar', custoCents: Math.round(custo), porMesCents: Math.round(custo / n), totalPagoCents: c.precoCents + c.manutencaoMensalCents * n });
  }
  if (e.alugar && e.alugar.mensalCents > 0) {
    let custo = 0;
    let total = 0;
    for (let m = 1; m <= n; m++) {
      const valor = Math.round(e.alugar.mensalCents * (1 + e.alugar.reajusteAnualPct / 100) ** Math.floor((m - 1) / 12));
      custo += vp(valor, m);
      total += valor;
    }
    opcoes.push({ opcao: 'alugar', custoCents: Math.round(custo), porMesCents: Math.round(custo / n), totalPagoCents: total });
  }
  if (e.assinar && e.assinar.mensalCents > 0) {
    let custo = 0;
    for (let m = 1; m <= n; m++) custo += vp(e.assinar.mensalCents, m);
    opcoes.push({ opcao: 'assinar', custoCents: Math.round(custo), porMesCents: Math.round(custo / n), totalPagoCents: e.assinar.mensalCents * n });
  }
  const melhor = opcoes.length ? opcoes.reduce((a, b) => (b.custoCents < a.custoCents ? b : a)).opcao : null;
  return { opcoes, melhor };
}
