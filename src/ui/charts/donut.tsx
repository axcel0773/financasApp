import { formatBRL } from '@/core/shared/money';

export interface Fatia {
  label: string;
  value: number;
  color: string;
}

/** Rosca em SVG (viewBox, largura 100%). A legenda traz nome, valor e % — cor nunca é o único sinal. */
export function Donut({ fatias, titulo }: { fatias: Fatia[]; titulo: string }) {
  const total = fatias.reduce((s, f) => s + f.value, 0);
  const R = 15.9155;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg
        viewBox="0 0 42 42"
        role="img"
        aria-label={`${titulo}: total ${formatBRL(total)}`}
        className="w-44 shrink-0"
      >
        <circle cx="21" cy="21" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
        {total > 0 &&
          fatias.map((f) => {
            const pct = (f.value / total) * 100;
            const el = (
              <circle
                key={f.label}
                cx="21"
                cy="21"
                r={R}
                fill="none"
                stroke={f.color}
                strokeWidth="6"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={25 - acc}
              />
            );
            acc += pct;
            return el;
          })}
        <text
          x="21"
          y="22.5"
          textAnchor="middle"
          className="amount"
          fontSize="4"
          fontWeight="800"
          fill="var(--ink)"
        >
          {formatBRL(total)}
        </text>
      </svg>
      <ul className="w-full space-y-1.5">
        {fatias.map((f) => (
          <li key={f.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ background: f.color }}
              />
              <span className="truncate">{f.label}</span>
            </span>
            <span className="amount shrink-0 text-muted">
              {formatBRL(f.value)} · {total > 0 ? Math.round((f.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
