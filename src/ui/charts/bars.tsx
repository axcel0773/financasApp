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
  const n = Math.max(1, barras.length);
  const bw = Math.min(44, (w - gap * (n + 1)) / n);
  const x0 = (w - (bw * n + gap * (n - 1))) / 2;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${titulo}: ${barras.map((b) => `${b.label} ${formatBRL(b.value)}`).join(', ')}`}
      className="w-full"
    >
      {barras.map((b, i) => {
        const bh = (b.value / max) * (base - 20);
        // barra em pílula: com valor, nunca menor que a própria largura; sem valor, só um traço
        const alt = b.value > 0 ? Math.max(bh, bw) : 3;
        const x = x0 + i * (bw + gap);
        return (
          <g key={b.label}>
            <rect
              x={x}
              y={base - alt}
              width={bw}
              height={alt}
              rx={Math.min(bw, alt) / 2}
              fill={b.destaque ? 'var(--chart)' : 'var(--soft)'}
              className="crescer-y"
              style={{ animationDelay: `${i * 40}ms` }}
            />
            <text
              x={x + bw / 2}
              y={base - alt - 4}
              textAnchor="middle"
              fontSize="8"
              fill="var(--muted)"
              className="amount"
            >
              R$ {Math.round(b.value / 100).toLocaleString('pt-BR')}
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
