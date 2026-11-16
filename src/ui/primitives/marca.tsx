/** Marca do app: três barras em pílula, crescentes (a mesma do ícone). Decorativa: o nome vem ao lado. */
export function Marca({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-[14px] bg-accent"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55}>
        <rect x="2" y="13" width="5" height="9" rx="2.5" fill="var(--accent-fg)" />
        <rect x="9.5" y="8" width="5" height="14" rx="2.5" fill="var(--accent-fg)" />
        <rect x="17" y="2" width="5" height="20" rx="2.5" fill="var(--accent-fg)" />
      </svg>
    </span>
  );
}
