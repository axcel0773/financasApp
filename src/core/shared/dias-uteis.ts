import { addDias, dataNoMes, diasNoMes, type Competencia, type IsoDate } from './competencia';

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), base da Sexta-feira Santa. */
export function pascoa(ano: number): IsoDate {
  const a = ano % 19,
    b = Math.floor(ano / 100),
    c = ano % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    mes = Math.floor((h + l - 7 * m + 114) / 31),
    dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Feriados nacionais (Lei 662/49, Lei 6.802/80, Lei 14.759/23) e a Sexta-feira Santa.
 * Carnaval e Corpus Christi são pontos facultativos e ficam de fora; feriados estaduais e municipais também.
 */
export function feriadosNacionais(ano: number): Set<IsoDate> {
  const fixos = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
  return new Set([...fixos.map((d) => `${ano}-${d}`), addDias(pascoa(ano), -2)]);
}

export function ehDiaUtil(d: IsoDate): boolean {
  const semana = new Date(`${d}T00:00:00Z`).getUTCDay();
  return semana !== 0 && semana !== 6 && !feriadosNacionais(Number(d.slice(0, 4))).has(d);
}

/** Último dia útil do mês (segunda a sexta, fora feriados nacionais). */
export function ultimoDiaUtil(c: Competencia): IsoDate {
  let d = dataNoMes(c, diasNoMes(c));
  while (!ehDiaUtil(d)) d = addDias(d, -1);
  return d;
}

/** N-ésimo dia útil do mês (o 5º dia útil é o prazo legal do salário mensal, CLT art. 459). */
export function enesimoDiaUtil(c: Competencia, n: number): IsoDate {
  let d = dataNoMes(c, 1),
    conta = ehDiaUtil(d) ? 1 : 0;
  while (conta < n) {
    d = addDias(d, 1);
    if (ehDiaUtil(d)) conta++;
  }
  return d;
}
