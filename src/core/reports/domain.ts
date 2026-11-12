import type { Cents } from '../shared/money';

export interface FatiaCategoria {
  categoryId: string | null;
  name: string;
  color: string;
  cents: Cents;
  pct: number;
}

export function totaisPorCategoria(
  gastos: { categoryId: string | null; cents: Cents }[],
  categorias: { id: string; name: string; color: string | null }[],
): FatiaCategoria[] {
  const total = gastos.reduce((s, g) => s + g.cents, 0);
  const mapa = new Map<string | null, Cents>();
  for (const g of gastos) mapa.set(g.categoryId, (mapa.get(g.categoryId) ?? 0) + g.cents);
  return [...mapa.entries()]
    .map(([id, cents]) => {
      const c = categorias.find((x) => x.id === id);
      return {
        categoryId: id,
        name: c?.name ?? 'Sem categoria',
        color: c?.color ?? '#667085',
        cents,
        pct: total > 0 ? (cents / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.cents - a.cents);
}

export interface ComparacaoMes {
  atualCents: Cents;
  anteriorCents: Cents;
  deltaCents: Cents;
  deltaPct: number | null;
}
export function compararMeses(atualCents: Cents, anteriorCents: Cents): ComparacaoMes {
  return {
    atualCents,
    anteriorCents,
    deltaCents: atualCents - anteriorCents,
    deltaPct: anteriorCents > 0 ? ((atualCents - anteriorCents) / anteriorCents) * 100 : null,
  };
}
