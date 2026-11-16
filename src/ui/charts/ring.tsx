/**
 * Anel de progresso (0–100%). Sem `rotulo`, é decorativo (o número ao lado é quem informa);
 * com `rotulo`, mostra o texto no centro e é lido por leitores de tela.
 */
export function Ring({
  pct,
  size = 44,
  alerta = false,
  rotulo,
  descricao,
  sobreEscuro = false,
}: {
  pct: number;
  size?: number;
  alerta?: boolean;
  rotulo?: string;
  descricao?: string;
  /** Dentro de um cartão escuro (Hero): texto branco e trilho translúcido. */
  sobreEscuro?: boolean;
}) {
  const R = 15.9155;
  const p = Math.max(0, Math.min(100, pct));
  // Percentuais absurdos (limite de centavos, por exemplo) não cabem no anel: o texto visível vira "+999%";
  // o leitor de tela continua ouvindo o valor real.
  const texto = rotulo && /^\d+%$/.test(rotulo) && parseInt(rotulo, 10) > 999 ? '+999%' : rotulo;
  return (
    <svg
      viewBox="0 0 42 42"
      width={size}
      height={size}
      className="shrink-0"
      {...(rotulo ? { role: 'img', 'aria-label': descricao ?? rotulo } : { 'aria-hidden': true })}
    >
      <circle cx="21" cy="21" r={R} fill="none" stroke={sobreEscuro ? 'rgba(255,255,255,0.18)' : 'var(--soft)'} strokeWidth="5" />
      {p > 0 && (
        <circle
          cx="21"
          cy="21"
          r={R}
          fill="none"
          stroke={alerta ? 'var(--expense)' : sobreEscuro ? 'var(--accent)' : 'var(--chart)'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${p} ${100 - p}`}
          strokeDashoffset="25"
          className="encher-anel"
        />
      )}
      {rotulo && (
        <text x="21" y="21" textAnchor="middle" dominantBaseline="central" fontSize={texto && texto.length > 4 ? 7.5 : 9} fontWeight="600" fill={sobreEscuro ? '#fff' : 'var(--ink)'}>
          {texto}
        </text>
      )}
    </svg>
  );
}
