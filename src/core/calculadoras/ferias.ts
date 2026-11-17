import { addDias, diffDias, type IsoDate } from '../shared/competencia';

export interface Feriado {
  data: IsoDate;
  nome: string;
  /** Ponto facultativo (Carnaval, Corpus Christi): depende da empresa. */
  facultativo: boolean;
}

const iso = (ano: number, mes: number, dia: number): IsoDate =>
  `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function pascoa(ano: number): IsoDate {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(ano, mes, dia);
}

/** Feriados nacionais (Lei 662/1949, Lei 6.802/1980, Lei 14.759/2023) e os pontos facultativos móveis. */
export function feriadosNacionais(ano: number): Feriado[] {
  const p = pascoa(ano);
  const lista: Feriado[] = [
    { data: iso(ano, 1, 1), nome: 'Confraternização Universal', facultativo: false },
    { data: addDias(p, -48), nome: 'Carnaval (segunda)', facultativo: true },
    { data: addDias(p, -47), nome: 'Carnaval (terça)', facultativo: true },
    { data: addDias(p, -2), nome: 'Sexta-feira Santa', facultativo: false },
    { data: iso(ano, 4, 21), nome: 'Tiradentes', facultativo: false },
    { data: iso(ano, 5, 1), nome: 'Dia do Trabalho', facultativo: false },
    { data: addDias(p, 60), nome: 'Corpus Christi', facultativo: true },
    { data: iso(ano, 9, 7), nome: 'Independência', facultativo: false },
    { data: iso(ano, 10, 12), nome: 'Nossa Senhora Aparecida', facultativo: false },
    { data: iso(ano, 11, 2), nome: 'Finados', facultativo: false },
    { data: iso(ano, 11, 15), nome: 'Proclamação da República', facultativo: false },
    { data: iso(ano, 11, 20), nome: 'Dia da Consciência Negra', facultativo: false },
    { data: iso(ano, 12, 25), nome: 'Natal', facultativo: false },
  ];
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}

/** 0 = domingo … 6 = sábado. */
export const diaDaSemana = (d: IsoDate): number => new Date(`${d}T00:00:00Z`).getUTCDay();

export interface JanelaFerias {
  inicio: IsoDate;
  fim: IsoDate;
  /** Primeiro e último dia de folga somando fins de semana e feriados colados. */
  folgaInicio: IsoDate;
  folgaFim: IsoDate;
  diasDeFolga: number;
  /** Dias de folga além dos dias de férias usados. */
  ganho: number;
  feriados: string[];
}

/**
 * Melhores datas para tirar `dias` de férias no ano (jornada de segunda a sexta).
 * Respeita o art. 134, §3º, da CLT: as férias não podem começar nos dois dias antes de feriado ou do descanso semanal
 * (domingo), então o início fica entre segunda e quinta e nunca colado antes de um feriado.
 */
export function melhoresJanelas(p: {
  ano: number;
  dias: number;
  feriados: Feriado[];
  /** Considera Carnaval e Corpus Christi como folga. */
  comFacultativos: boolean;
  /** Só sugere inícios a partir desta data. */
  aPartirDe?: IsoDate;
  limite?: number;
}): JanelaFerias[] {
  const dias = Math.min(30, Math.max(5, Math.round(p.dias)));
  const valem = p.feriados.filter((f) => p.comFacultativos || !f.facultativo);
  const nomes = new Map(valem.map((f) => [f.data, f.nome]));
  const folga = (d: IsoDate) => [0, 6].includes(diaDaSemana(d)) || nomes.has(d);

  const candidatas: JanelaFerias[] = [];
  const primeiro = iso(p.ano, 1, 1);
  const total = diffDias(primeiro, iso(p.ano, 12, 31));
  for (let k = 0; k <= total; k++) {
    const inicio = addDias(primeiro, k);
    if (p.aPartirDe && inicio < p.aPartirDe) continue;
    const dow = diaDaSemana(inicio);
    if (dow < 1 || dow > 4 || nomes.has(inicio)) continue;
    if (nomes.has(addDias(inicio, 1)) || nomes.has(addDias(inicio, 2))) continue;
    const fim = addDias(inicio, dias - 1);
    let folgaInicio = inicio;
    while (folga(addDias(folgaInicio, -1))) folgaInicio = addDias(folgaInicio, -1);
    let folgaFim = fim;
    while (folga(addDias(folgaFim, 1))) folgaFim = addDias(folgaFim, 1);
    const diasDeFolga = diffDias(folgaInicio, folgaFim) + 1;
    const feriados = valem.filter((f) => f.data >= folgaInicio && f.data <= folgaFim).map((f) => f.nome);
    candidatas.push({ inicio, fim, folgaInicio, folgaFim, diasDeFolga, ganho: diasDeFolga - dias, feriados });
  }
  candidatas.sort((a, b) => b.diasDeFolga - a.diasDeFolga || a.inicio.localeCompare(b.inicio));

  // escolhe janelas que não se sobrepõem, para as sugestões não serem a mesma semana deslocada
  const escolhidas: JanelaFerias[] = [];
  for (const c of candidatas) {
    if (escolhidas.some((e) => c.folgaInicio <= e.folgaFim && c.folgaFim >= e.folgaInicio)) continue;
    escolhidas.push(c);
    if (escolhidas.length >= (p.limite ?? 5)) break;
  }
  return escolhidas;
}
