import { diffDias, type IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';
import { formatBRL } from '../shared/money';

export type TomAviso = 'perigo' | 'alerta' | 'info';
export interface Aviso {
  id: string;
  tom: TomAviso;
  titulo: string;
  detalhe: string;
  href: string;
}
export interface EntradaAvisos {
  hoje: IsoDate;
  beneficios: { nome: string; proximoCredito: IsoDate | null }[];
  orcamentos: { nome: string; usadoPct: number; estado: 'sem_limite' | 'ok' | 'alerta' | 'estourado' }[];
  contas: { nome: string; date: IsoDate; amountCents: Cents }[];
  validadeTabela: IsoDate | null;
  saldoAbaixoDoMinimo: { data: IsoDate; saldoCents: Cents } | null;
}

const DIAS_ANTECEDENCIA = 3;
const ORDEM: Record<TomAviso, number> = { perigo: 0, alerta: 1, info: 2 };
const quando = (n: number) => (n === 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias`);

/** Avisos do app, do mais urgente ao menos: orçamento estourado, saldo baixo, contas, crédito de VR/VA, tabela vencida. */
export function gerarAvisos(e: EntradaAvisos): Aviso[] {
  const out: Aviso[] = [];
  for (const o of e.orcamentos) {
    if (o.estado === 'estourado')
      out.push({ id: `orc-${o.nome}`, tom: 'perigo', titulo: `${o.nome}: orçamento estourado`, detalhe: `${o.usadoPct}% do limite do mês.`, href: '/orcamento' });
    else if (o.estado === 'alerta')
      out.push({ id: `orc-${o.nome}`, tom: 'alerta', titulo: `${o.nome}: perto do limite`, detalhe: `${o.usadoPct}% do limite do mês.`, href: '/orcamento' });
  }
  if (e.saldoAbaixoDoMinimo)
    out.push({ id: 'saldo-min', tom: 'perigo', titulo: 'Saldo previsto abaixo do mínimo', detalhe: `Chega a ${formatBRL(e.saldoAbaixoDoMinimo.saldoCents)} em ${e.saldoAbaixoDoMinimo.data.split('-').reverse().join('/')}.`, href: '/fluxo-de-caixa' });
  for (const c of e.contas) {
    const n = diffDias(e.hoje, c.date);
    if (n >= 0 && n <= DIAS_ANTECEDENCIA)
      out.push({ id: `conta-${c.nome}-${c.date}`, tom: 'alerta', titulo: `${c.nome} vence ${quando(n)}`, detalhe: formatBRL(c.amountCents), href: '/fixos' });
  }
  for (const b of e.beneficios) {
    if (!b.proximoCredito) continue;
    const n = diffDias(e.hoje, b.proximoCredito);
    if (n >= 0 && n <= DIAS_ANTECEDENCIA)
      out.push({ id: `cred-${b.nome}`, tom: 'info', titulo: `${b.nome} cai ${quando(n)}`, detalhe: 'Registre o crédito quando chegar.', href: '/beneficios' });
  }
  if (e.validadeTabela && Number(e.validadeTabela.slice(0, 4)) < Number(e.hoje.slice(0, 4)))
    out.push({ id: 'tabela', tom: 'info', titulo: 'Tabelas de INSS e IRRF desatualizadas', detalhe: `Vigência de ${e.validadeTabela.slice(0, 4)}. Confira os valores do ano.`, href: '/mais/impostos' });
  return out.sort((a, b) => ORDEM[a.tom] - ORDEM[b.tom]);
}
