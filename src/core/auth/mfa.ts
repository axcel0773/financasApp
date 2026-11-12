/** Regras da segunda etapa (TOTP): puras, sem Supabase. */
export interface FatorAuth {
  status: string;
  factor_type?: string;
}

/** O usuário tem ao menos um autenticador (TOTP) verificado? Fatores pendentes não contam. */
export function temSegundaEtapa(fatores: readonly FatorAuth[] | null | undefined): boolean {
  return (fatores ?? []).some(
    (f) => f.status === 'verified' && (f.factor_type === undefined || f.factor_type === 'totp'),
  );
}

/** Lê a claim `aal` do payload de um JWT (já validado antes por getUser). Ausente ou ilegível = aal1. */
export function aalDoToken(jwt: string | null | undefined): 'aal1' | 'aal2' {
  try {
    const payload = jwt?.split('.')[1];
    if (!payload) return 'aal1';
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')));
    return json?.aal === 'aal2' ? 'aal2' : 'aal1';
  } catch {
    return 'aal1';
  }
}

/** Precisa mostrar a tela do código? Sim quando há TOTP verificado e a sessão ainda é aal1. */
export function exigeCodigo(
  fatores: readonly FatorAuth[] | null | undefined,
  aal: 'aal1' | 'aal2',
): boolean {
  return temSegundaEtapa(fatores) && aal !== 'aal2';
}
