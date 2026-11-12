import { formatBRL } from '@/core/shared/money';

export interface Barra {
  label: string;
  value: number;
  destaque?: boolean;
}

export function Bars({ barras, titulo }: { barras: Barra[]; titulo: string }) {
  const max = Math.max(1, ...barras.map((b) => b.value));
  const w = 300,
    h = 150,
    base = 120,
    gap = 10;
  const bw = (w - gap * (barras.length + 1)) / Math.max(1, barras.length);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${titulo}: ${barras.map((b) => `${b.label} ${formatBRL(b.value)}`).join(', ')}`}
      className="w-full"
    >
      {barras.map((b, i) => {
        const bh = (b.value / max) * (base - 20);
        const x = gap + i * (bw + gap);
        return (
          <g key={b.label}>
            <rect
              x={x}
              y={base - bh}
              width={bw}
              height={Math.max(bh, 1)}
              rx="4"
              fill={b.destaque ? 'var(--primary)' : 'var(--border)'}
            />
            <text
              x={x + bw / 2}
              y={base - bh - 4}
              textAnchor="middle"
              fontSize="8"
              fill="var(--muted)"
              className="amount"
            >
              {Math.round(b.value / 100).toLocaleString('pt-BR')}
            </text>
            <text x={x + bw / 2} y={base + 14} textAnchor="middle" fontSize="9" fill="var(--ink)">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
