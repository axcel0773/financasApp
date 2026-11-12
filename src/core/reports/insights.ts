import { competenciaDe, ultimoDia, type Competencia, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface EntradaInsights {
  hoje: IsoDate;
  mes: Competencia;
  /** Despesas do mês analisado, sem VR/VA. */
  atual: { categoryId: string | null; cents: Cents }[];
  /** Despesas dos meses anteriores (até 3), sem VR/VA, já com a competência de cada uma. */
  anteriores: { categoryId: string | null; cents: Cents; competencia: Competencia }[];
  categorias: { id: string; name: string }[];
  /** Soma dos gastos fixos ativos por mês. */
  fixosCents: Cents;
  /** Renda recebida no mês analisado (null se não houver). */
  rendaCents: Cents | null;
}

export interface Insights {
  /** Só existe para o mês corrente. */
  projecao: { gastoAteHojeCents: Cents; projecaoCents: Cents; diasDecorridos: number; diasNoMes: number } | null;
  emAlta: { nome: string; atualCents: Cents; mediaCents: Cents; deltaCents: Cents; deltaPct: number }[];
  maiores: { nome: string; cents: Cents; pct: number }[];
  economias: { nome: string; mensal10Cents: Cents; mensal20Cents: Cents; anual20Cents: Cents }[];
  fixosPctRenda: number | null;
  mesesDeHistorico: number;
}

const ALTA_MIN_PCT = 20;
const ALTA_MIN_CENTS = 5000; // ignora oscilações menores que R$ 50

/** Diagnóstico simples e determinístico: projeção do mês, categorias em alta, maiores pesos e quanto cortar economizaria. */
export function gerarInsights(e: EntradaInsights): Insights {
  const nome = (id: string | null) => e.categorias.find((c) => c.id === id)?.name ?? 'Sem categoria';
  const somar = (itens: { categoryId: string | null; cents: Cents }[]) => {
    const m = new Map<string | null, Cents>();
    for (const i of itens) m.set(i.categoryId, (m.get(i.categoryId) ?? 0) + i.cents);
    return m;
  };
  const atual = somar(e.atual);
  const total = [...atual.values()].reduce((s, v) => s + v, 0);

  let projecao: Insights['projecao'] = null;
  if (e.mes === competenciaDe(e.hoje) && total > 0) {
    const diasDecorridos = Math.max(1, Number(e.hoje.slice(8)));
    const diasNoMes = Number(ultimoDia(e.mes).slice(8));
    projecao = {
      gastoAteHojeCents: total,
      diasDecorridos,
      diasNoMes,
      projecaoCents: Math.round((total / diasDecorridos) * diasNoMes),
    };
  }

  const mesesComGasto = new Set(e.anteriores.filter((a) => a.cents > 0).map((a) => a.competencia));
  const mesesDeHistorico = mesesComGasto.size;
  const media = somar(e.anteriores);
  const emAlta: Insights['emAlta'] = [];
  if (mesesDeHistorico > 0) {
    for (const [id, cents] of atual) {
      const mediaCents = Math.round((media.get(id) ?? 0) / mesesDeHistorico);
      const deltaCents = cents - mediaCents;
      if (mediaCents > 0 && deltaCents >= ALTA_MIN_CENTS && (deltaCents / mediaCents) * 100 >= ALTA_MIN_PCT)
        emAlta.push({ nome: nome(id), atualCents: cents, mediaCents, deltaCents, deltaPct: (deltaCents / mediaCents) * 100 });
    }
    emAlta.sort((a, b) => b.deltaCents - a.deltaCents);
  }

  const ordenadas = [...atual.entries()].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  const maiores = ordenadas.slice(0, 3).map(([id, cents]) => ({ nome: nome(id), cents, pct: total > 0 ? (cents / total) * 100 : 0 }));
  const economias = ordenadas.slice(0, 3).map(([id, cents]) => ({
    nome: nome(id),
    mensal10Cents: Math.round(cents * 0.1),
    mensal20Cents: Math.round(cents * 0.2),
    anual20Cents: Math.round(cents * 0.2) * 12,
  }));

  return {
    projecao,
    emAlta: emAlta.slice(0, 3),
    maiores,
    economias,
    fixosPctRenda: e.rendaCents && e.rendaCents > 0 ? (e.fixosCents / e.rendaCents) * 100 : null,
    mesesDeHistorico,
  };
}
