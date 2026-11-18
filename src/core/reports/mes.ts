import { competenciaDe, ultimoDia, type Competencia, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';

export interface EntradaComoEstaMes {
  hoje: IsoDate;
  mes: Competencia;
  /** Renda do mês: o que já entrou mais o que ainda está previsto. */
  rendaCents: Cents;
  /** Gastos do mês sem VR/VA. `comprometido` = veio de fixo ou parcela; `viagem` = gasto de uma viagem. */
  gastos: { cents: Cents; comprometido: boolean; viagem?: boolean }[];
  /** Fixos do mês que ainda não viraram lançamento. */
  fixosPendentesCents: Cents;
  /** Meta de poupança, em % da renda. */
  metaPct: number;
}

export interface ComoEstaMes {
  /** Mês corrente: os números do dia a dia são projetados até o fim do mês. */
  projetado: boolean;
  diasDecorridos: number;
  diasNoMes: number;
  diasRestantes: number;
  rendaCents: Cents;
  /** Fixos e parcelas do mês, lançados ou não. */
  fixosCents: Cents;
  /** Gasto do dia a dia lançado até agora. */
  diaADiaCents: Cents;
  /** Dia a dia no fim do mês, no ritmo atual (igual ao lançado em meses passados). */
  diaADiaFimCents: Cents;
  /** Gastos de viagens no mês: entram pelo valor lançado, sem projeção (são pontuais). */
  viagensCents: Cents;
  /** Fixos + dia a dia no fim do mês + viagens. */
  custoDeVidaCents: Cents;
  /** Renda − custo de vida (o que deve sobrar no fim do mês). */
  sobraFimCents: Cents;
  /** Sobra ÷ renda, em %; null sem renda. */
  poupancaPct: number | null;
  metaPct: number;
  metaCents: Cents;
  /** Média do dia a dia por dia decorrido. */
  mediaDiariaCents: Cents;
  /** (Renda − fixos − meta) ÷ dias do mês; null sem renda. */
  limiteDiarioCents: Cents | null;
  /** Quanto ainda dá por dia, até o fim do mês, sem furar a meta; null fora do mês corrente ou sem renda. */
  podePorDiaCents: Cents | null;
}

/**
 * "Como está o mês": poupança, custo de vida e gasto médio por dia.
 * Fixos e parcelas contam pelo valor do mês inteiro; o dia a dia é projetado pelo ritmo dos dias decorridos.
 */
export function comoEstaMes(e: EntradaComoEstaMes): ComoEstaMes {
  const diasNoMes = Number(ultimoDia(e.mes).slice(8));
  const corrente = e.mes === competenciaDe(e.hoje);
  const passado = e.mes < competenciaDe(e.hoje);
  const diasDecorridos = corrente ? Math.max(1, Number(e.hoje.slice(8))) : passado ? diasNoMes : 0;
  const diasRestantes = corrente ? diasNoMes - diasDecorridos : 0;

  const lancadosFixos = e.gastos.filter((g) => g.comprometido).reduce((s, g) => s + g.cents, 0);
  const fixosCents = lancadosFixos + Math.max(0, e.fixosPendentesCents);
  const diaADiaCents = e.gastos.filter((g) => !g.comprometido && !g.viagem).reduce((s, g) => s + g.cents, 0);
  const viagensCents = e.gastos.filter((g) => !g.comprometido && g.viagem).reduce((s, g) => s + g.cents, 0);
  const diaADiaFimCents =
    corrente && diasDecorridos > 0 ? Math.round((diaADiaCents / diasDecorridos) * diasNoMes) : diaADiaCents;
  const custoDeVidaCents = fixosCents + diaADiaFimCents + viagensCents;
  const renda = Math.max(0, e.rendaCents);
  const sobraFimCents = renda - custoDeVidaCents;
  const metaPct = Math.min(90, Math.max(0, e.metaPct));
  const metaCents = Math.round((renda * metaPct) / 100);
  const paraDiaADia = renda - fixosCents - viagensCents - metaCents;

  return {
    projetado: corrente,
    diasDecorridos,
    diasNoMes,
    diasRestantes,
    rendaCents: renda,
    fixosCents,
    diaADiaCents,
    diaADiaFimCents,
    viagensCents,
    custoDeVidaCents,
    sobraFimCents,
    poupancaPct: renda > 0 ? (sobraFimCents / renda) * 100 : null,
    metaPct,
    metaCents,
    mediaDiariaCents: diasDecorridos > 0 ? Math.round(diaADiaCents / diasDecorridos) : 0,
    limiteDiarioCents: renda > 0 ? Math.max(0, Math.round(paraDiaADia / diasNoMes)) : null,
    podePorDiaCents:
      renda > 0 && corrente && diasRestantes > 0 ? Math.round((paraDiaADia - diaADiaCents) / diasRestantes) : null,
  };
}
