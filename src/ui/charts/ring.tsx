/** Anel de progresso pequeno (0–100%). O número ao lado é quem informa; o anel só reforça. */
export function Ring({ pct, size = 44, alerta = false }: { pct: number; size?: number; alerta?: boolean }) {
  const R = 15.9155;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg viewBox="0 0 42 42" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx="21" cy="21" r={R} fill="none" stroke="var(--soft)" strokeWidth="5" />
      {p > 0 && (
        <circle
          cx="21"
          cy="21"
          r={R}
          fill="none"
          stroke={alerta ? 'var(--expense)' : 'var(--chart)'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${p} ${100 - p}`}
          strokeDashoffset="25"
        />
      )}
    </svg>
  );
}
