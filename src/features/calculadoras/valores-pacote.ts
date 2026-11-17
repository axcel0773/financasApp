import { campo, cents, num, pct } from './campos';

/** Texto dos campos de um pacote CLT (usado no servidor para o valor inicial e no navegador). */
export interface ValoresPacote {
  bruto: string;
  descontoVr: string;
  vr: string;
  va: string;
  saude: string;
  outros: string;
  plr: string;
}

export const valoresIniciais = (d: { brutoCents: number; descontoVrPercent: number; vrMensalCents: number; vaMensalCents: number }): ValoresPacote => ({
  bruto: campo(d.brutoCents),
  descontoVr: pct(d.descontoVrPercent),
  vr: campo(d.vrMensalCents),
  va: campo(d.vaMensalCents),
  saude: '',
  outros: '',
  plr: '',
});

export const paraEntrada = (v: ValoresPacote) => ({
  brutoCents: cents(v.bruto),
  descontoVrPercent: Math.min(100, Math.max(0, num(v.descontoVr))),
  beneficios: [
    { nome: 'Vale-refeição', mensalCents: cents(v.vr) },
    { nome: 'Vale-alimentação', mensalCents: cents(v.va) },
    { nome: 'Plano de saúde (parte da empresa)', mensalCents: cents(v.saude) },
    { nome: 'Outros benefícios', mensalCents: cents(v.outros) },
  ],
  plrLiquidoAnualCents: cents(v.plr),
});
