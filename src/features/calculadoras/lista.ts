import type { IconName } from '@/ui/primitives/icon';

/** As calculadoras do grupo 1, na ordem do índice. */
export const CALCULADORAS: { slug: string; titulo: string; resumo: string; icone: IconName }[] = [
  { slug: 'pacote', titulo: 'Quanto vale meu pacote', resumo: 'Salário, 13º, férias, FGTS e benefícios num valor só', icone: 'wallet' },
  { slug: 'horas', titulo: 'Preço em horas de trabalho', resumo: 'Quanto tempo de trabalho custa uma compra', icone: 'tag' },
  { slug: 'e-se', titulo: 'Simulador "e se"', resumo: 'O que acontece com a reserva se a renda ou os gastos mudarem', icone: 'flow' },
  { slug: 'clt-pj-mei', titulo: 'CLT, PJ ou MEI', resumo: 'Quanto sobra no ano em cada regime', icone: 'receipt' },
  { slug: 'proposta', titulo: 'Simulador de proposta', resumo: 'Proposta nova contra o emprego atual', icone: 'star' },
  { slug: 'fgts', titulo: 'Saque-aniversário ou saque-rescisão', resumo: 'O que você recebe em cada modalidade do FGTS', icone: 'shield' },
  { slug: 'comprar-alugar-assinar', titulo: 'Comprar, alugar ou assinar', resumo: 'Qual sai mais barato no mesmo período', icone: 'cart' },
  { slug: 'ferias', titulo: 'Férias e feriados', resumo: 'As datas que rendem mais dias de folga', icone: 'plane' },
];

export const tituloDe = (slug: string): string => CALCULADORAS.find((c) => c.slug === slug)?.titulo ?? '';
