import { diffDias, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface EventoCaixa {
  date: IsoDate;
  cents: Cents;
  label: string;
} // + entra, − sai
export interface PontoSaldo {
  date: IsoDate;
  saldoCents: Cents;
}
export interface ProjecaoCaixa {
  pontos: PontoSaldo[];
  menorSaldo: PontoSaldo;
  alerta: boolean;
}

/**
 * Saldo projetado = saldo atual + recebimentos previstos − contas e parcelas previstas, por data.
 * Alerta quando o menor saldo do período fica abaixo do mínimo configurado.
 */
export function projetarSaldo(
  saldoAtualCents: Cents,
  hoje: IsoDate,
  ate: IsoDate,
  eventos: EventoCaixa[],
  minimoCents: Cents,
): ProjecaoCaixa {
  const relevantes = eventos
    .filter((e) => diffDias(hoje, e.date) >= 0 && diffDias(e.date, ate) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pontos: PontoSaldo[] = [{ date: hoje, saldoCents: saldoAtualCents }];
  let saldo = saldoAtualCents;
  for (const e of relevantes) {
    saldo += e.cents;
    const ultimo = pontos[pontos.length - 1]!;
    if (ultimo.date === e.date) ultimo.saldoCents = saldo;
    else pontos.push({ date: e.date, saldoCents: saldo });
  }
  const menorSaldo = pontos.reduce((m, p) => (p.saldoCents < m.saldoCents ? p : m), pontos[0]!);
  return { pontos, menorSaldo, alerta: menorSaldo.saldoCents < minimoCents };
}
