export function Sparkline({ values, titulo }: { values: number[]; titulo: string }) {
  if (values.length < 2) return null;
  const w = 100,
    h = 28;
  const lo = Math.min(...values),
    hi = Math.max(...values),
    span = Math.max(1, hi - lo);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - lo) / span) * (h - 4)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={titulo} className="h-7 w-24">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
