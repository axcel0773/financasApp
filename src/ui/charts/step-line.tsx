import { formatBRL } from '@/core/shared/money';

export interface PontoLinha {
  label: string;
  value: number;
}

/** Linha em degraus: o saldo só muda nos dias em que há entrada ou saída. Marca o menor saldo com ponto e rótulo. */
export function StepLine({
  pontos,
  titulo,
  minimo = 0,
}: {
  pontos: PontoLinha[];
  titulo: string;
  minimo?: number;
}) {
  if (pontos.length === 0) return null;
  const w = 300,
    h = 140,
    pad = 12;
  const vals = pontos.map((p) => p.value).concat(minimo);
  const lo = Math.min(...vals),
    hi = Math.max(...vals);
  const span = Math.max(1, hi - lo);
  const x = (i: number) =>
    pad + (pontos.length === 1 ? 0 : (i / (pontos.length - 1)) * (w - pad * 2));
  const y = (v: number) => pad + (1 - (v - lo) / span) * (h - pad * 2 - 14);
  let d = `M ${x(0)} ${y(pontos[0]!.value)}`;
  for (let i = 1; i < pontos.length; i++) d += ` H ${x(i)} V ${y(pontos[i]!.value)}`;
  const menor = pontos.reduce((m, p, i) => (p.value < m.v ? { v: p.value, i } : m), {
    v: pontos[0]!.value,
    i: 0,
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${titulo}. Menor saldo ${formatBRL(menor.v)} em ${pontos[menor.i]!.label}`}
      className="w-full"
    >
      <line
        x1={pad}
        x2={w - pad}
        y1={y(minimo)}
        y2={y(minimo)}
        stroke="var(--border)"
        strokeDasharray="3 3"
      />
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(menor.i)} cy={y(menor.v)} r="4" fill="var(--expense)" />
      <text
        x={Math.min(Math.max(x(menor.i), 40), w - 40)}
        y={y(menor.v) + 14}
        textAnchor="middle"
        fontSize="8"
        fill="var(--expense-text)"
        className="amount"
      >
        Menor: {formatBRL(menor.v)}
      </text>
      <text x={pad} y={h - 2} fontSize="8" fill="var(--muted)">
        {pontos[0]!.label}
      </text>
      <text x={w - pad} y={h - 2} fontSize="8" textAnchor="end" fill="var(--muted)">
        {pontos[pontos.length - 1]!.label}
      </text>
    </svg>
  );
}
