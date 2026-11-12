import type { IconName } from '../primitives/icon';

export interface ItemNav {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_PRINCIPAL: ItemNav[] = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/gastos', label: 'Gastos', icon: 'list' },
  { href: '/renda', label: 'Renda', icon: 'wallet' },
  { href: '/beneficios', label: 'VR/VA', icon: 'ticket' },
  { href: '/mais', label: 'Mais', icon: 'menu' },
];
export const NAV_PLANEJAMENTO: ItemNav[] = [
  { href: '/fluxo-de-caixa', label: 'Fluxo de caixa', icon: 'flow' },
  { href: '/orcamento', label: 'Orçamento', icon: 'target' },
  { href: '/relatorios', label: 'Relatórios', icon: 'pie' },
  { href: '/cartao', label: 'Fatura do cartão', icon: 'card' },
  { href: '/fixos', label: 'Fixos e parcelas', icon: 'repeat' },
];
export const NAV_INVESTIR: ItemNav[] = [
  { href: '/investimentos', label: 'Investimentos', icon: 'trend' },
  { href: '/investimentos/simulador', label: 'Simulador', icon: 'calc' },
  { href: '/metas', label: 'Metas e reserva', icon: 'target' },
];
