import { addMeses, competenciaDe, dataNoMes, diffDias, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface ResumoBeneficio {
  diasAteCredito: number;
  disponivelPorDiaCents: Cents;
  mediaDiariaCents: Cents;
  sobraProjetadaCents: Cents;
}

/**
 * Disponível por dia = saldo ÷ dias até o próximo crédito.
 * Sobra projetada = saldo − média diária × dias restantes.
 * A média usa os gastos do período já decorrido (diasDecorridos ≥ 1).
 */
export function resumirBeneficio(p: {
  saldoCents: Cents;
  hoje: IsoDate;
  proximoCredito: IsoDate;
  gastoNoPeriodoCents: Cents;
  diasDecorridos: number;
}): ResumoBeneficio {
  const dias = Math.max(1, diffDias(p.hoje, p.proximoCredito));
  const media = Math.round(p.gastoNoPeriodoCents / Math.max(1, p.diasDecorridos));
  return {
    diasAteCredito: dias,
    disponivelPorDiaCents: Math.floor(p.saldoCents / dias),
    mediaDiariaCents: media,
    sobraProjetadaCents: p.saldoCents - media * dias,
  };
}

/** Próximo crédito: mesmo dia do mês do último crédito, no mês corrente se ainda não passou, senão no seguinte. */
export function proximoCredito(ultimoCredito: IsoDate, hoje: IsoDate): IsoDate {
  const dia = Number(ultimoCredito.slice(8, 10));
  const esteMes = dataNoMes(competenciaDe(hoje), dia);
  return esteMes >= hoje ? esteMes : dataNoMes(addMeses(competenciaDe(hoje), 1), dia);
}
