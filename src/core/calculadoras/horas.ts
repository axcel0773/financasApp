import type { Cents } from '../shared/money';

/** Semanas por mês na conta da CLT: 44 h/semana → 220 h/mês. */
const SEMANAS_POR_MES = 5;

/** Valor de uma hora do seu trabalho, a partir do líquido do mês e da jornada semanal. */
export function valorDaHora(liquidoMensalCents: Cents, horasSemanais: number): Cents {
  const horasMes = Math.max(1, horasSemanais) * SEMANAS_POR_MES;
  return Math.round(Math.max(0, liquidoMensalCents) / horasMes);
}

export interface PrecoEmTempo {
  horas: number;
  /** Dias de trabalho (jornada diária = semanal ÷ 5). */
  dias: number;
  /** Fração do mês de trabalho (1 = um mês inteiro). */
  meses: number;
}

/** Quanto tempo de trabalho custa um preço. */
export function precoEmTempo(precoCents: Cents, liquidoMensalCents: Cents, horasSemanais: number): PrecoEmTempo | null {
  const hora = valorDaHora(liquidoMensalCents, horasSemanais);
  if (hora <= 0) return null;
  const horas = Math.max(0, precoCents) / hora;
  const porDia = Math.max(1, horasSemanais) / 5;
  return { horas, dias: horas / porDia, meses: Math.max(0, precoCents) / Math.max(1, liquidoMensalCents) };
}

/** Texto curto: "45 min", "3,5 h", "2,3 dias", "1,4 mês". */
export function descreverTempo(t: PrecoEmTempo): string {
  const br = (n: number) => n.toFixed(1).replace('.', ',').replace(/,0$/, '');
  if (t.horas < 1) return `${Math.max(1, Math.round(t.horas * 60))} min`;
  if (t.dias < 1) return `${br(t.horas)} h`;
  if (t.meses < 1) return `${br(t.dias)} ${t.dias < 2 ? 'dia' : 'dias'}`;
  return `${br(t.meses)} ${t.meses < 2 ? 'mês' : 'meses'}`;
}

/**
 * Selo dos gastos ("1,3 dia"): só para despesa paga com dinheiro do salário (VR/VA não contam).
 * null quando o selo está desligado (jornada 0), sem renda cadastrada ou para entradas.
 */
export function seloTempoDeTrabalho(p: {
  cents: Cents;
  kind: 'expense' | 'income';
  beneficio: boolean;
  liquidoMensalCents: Cents;
  horasSemanais: number;
}): string | null {
  if (p.kind !== 'expense' || p.beneficio || p.horasSemanais <= 0 || p.cents <= 0) return null;
  const t = precoEmTempo(p.cents, p.liquidoMensalCents, p.horasSemanais);
  return t ? descreverTempo(t) : null;
}
