import { getContainer } from '@/composition/container';
import { competenciaDe } from '@/core/shared/competencia';

/** Dados que quase toda tela precisa: carteiras, categorias e a data de hoje (relógio injetado). */
export async function carregarBase() {
  const c = await getContainer();
  const [wallets, categories] = await Promise.all([c.wallets.list(), c.categories.list()]);
  const hoje = c.clock.hoje();
  return { c, wallets, categories, hoje, mesAtual: competenciaDe(hoje) };
}
export type Base = Awaited<ReturnType<typeof carregarBase>>;
