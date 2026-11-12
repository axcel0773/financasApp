'use client';

/** Último recurso: mostra uma mensagem genérica, sem detalhes técnicos. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui', padding: 24 }}>
        <h1>Algo deu errado</h1>
        <p>Tente novamente em instantes.</p>
        <button onClick={reset} style={{ minHeight: 44, padding: '0 20px' }}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
