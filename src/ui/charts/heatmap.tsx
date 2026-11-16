import { formatBRL } from '@/core/shared/money';

export interface DiaCalor {
  /** Dia do mês (1–31). */
  dia: number;
  cents: number;
  /** Dia ainda não chegou. */
  futuro?: boolean;
}

const NIVEIS = [0, 30, 55, 78, 100] as const;

/**
 * Mapa de calor do mês: um quadrado por dia, mais forte quanto maior o gasto.
 * A cor não é o único sinal: cada quadrado tem o valor no título e o resumo em texto vem logo abaixo.
 */
export function Heatmap({ dias, titulo }: { dias: DiaCalor[]; titulo: string }) {
  const max = Math.max(0, ...dias.map((d) => d.cents));
  const nivel = (c: number) => (c <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4)));
  const comGasto = dias.filter((d) => d.cents > 0);
  const maior = comGasto.reduce<DiaCalor | null>((m, d) => (!m || d.cents > m.cents ? d : m), null);
  return (
    <div>
      <div
        role="img"
        aria-label={`${titulo}: ${comGasto.length} ${comGasto.length === 1 ? 'dia' : 'dias'} com gasto${
          maior ? `; maior no dia ${maior.dia}, ${formatBRL(maior.cents)}` : ''
        }`}
        className="grid grid-cols-[repeat(11,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(16,minmax(0,1fr))]"
      >
        {dias.map((d) => {
          const n = nivel(d.cents);
          return (
            <span
              key={d.dia}
              title={d.futuro ? `Dia ${d.dia}` : `Dia ${d.dia}: ${formatBRL(d.cents)}`}
              className={
                d.futuro
                  ? 'aspect-square rounded-[6px] border border-dashed border-border'
                  : 'aspect-square rounded-[6px]'
              }
              style={
                d.futuro
                  ? undefined
                  : { background: n === 0 ? 'var(--soft)' : `color-mix(in srgb, var(--chart) ${NIVEIS[n]}%, var(--soft))` }
              }
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span className="min-w-0 truncate">
          {maior ? (
            <>
              Maior dia: {maior.dia} · <span className="amount">{formatBRL(maior.cents)}</span>
            </>
          ) : (
            'Nenhum gasto neste mês ainda.'
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
          menos
          {NIVEIS.map((n) => (
            <span
              key={n}
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: n === 0 ? 'var(--soft)' : `color-mix(in srgb, var(--chart) ${n}%, var(--soft))` }}
            />
          ))}
          mais
        </span>
      </div>
    </div>
  );
}
