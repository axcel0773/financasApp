import { getContainer } from '@/composition/container';
import { competenciaDe } from '@/core/shared/competencia';
import { ROTULO_CARTEIRA } from '@/core/wallets/domain';

/** Dados que quase toda tela precisa: carteiras, categorias e a data de hoje (relógio injetado). */
export async function carregarBase() {
  const c = await getContainer();
  const [wallets, categories] = await Promise.all([c.wallets.list(), c.categories.list()]);
  const hoje = c.clock.hoje();
  return { c, wallets, categories, hoje, mesAtual: competenciaDe(hoje) };
}
export type Base = Awaited<ReturnType<typeof carregarBase>>;

/** Opções do formulário de lançamento (página no celular, painel lateral no desktop). */
export function opcoesLancamento({ wallets, categories }: Pick<Base, 'wallets' | 'categories'>) {
  return {
    carteiras: wallets.map((w) => ({
      id: w.id,
      nome: w.kind === 'checking' || w.kind === 'cash' ? w.name : `${ROTULO_CARTEIRA[w.kind]} · ${w.name}`,
    })),
    categorias: categories.map((x) => ({ id: x.id, nome: x.name, cor: x.color })),
    carteiraInicial: (wallets.find((w) => w.kind === 'checking') ?? wallets[0])?.id ?? '',
  };
}
