'use client';

import Link from 'next/link';
import type { WalletKind } from '@/core/wallets/domain';
import { addDias } from '@/core/shared/competencia';
import { formatBRL, parseBRL } from '@/core/shared/money';
import { centavosParaCampo } from '@/ui/format';
import { cx } from '@/ui/cx';
import { CategoryIcon } from '@/ui/patterns/category-icon';
import { Icon, type IconName } from '@/ui/primitives/icon';
import { Input, MoneyInput, Select } from '@/ui/primitives/fields';
import { useNovoLancamento } from './use-novo-lancamento';

export interface CarteiraOp {
  id: string;
  curto: string;
  detalhe: string | null;
  tipo: WalletKind;
}
interface CategoriaOp {
  id: string;
  nome: string;
  cor?: string | null;
}
interface ViagemOp {
  id: string;
  nome: string;
}

const ICONE_CARTEIRA: Record<WalletKind, IconName> = {
  checking: 'wallet',
  meal_voucher: 'fork',
  food_voucher: 'cart',
  credit_card: 'card',
  cash: 'tag',
};

const ROTULO = 'mb-2 block text-sm font-medium text-muted';
const KBD = 'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md border border-border px-1.5 text-xs text-ink';
const BLOCO = 'flex flex-col items-start rounded-[16px] border p-3 text-left transition-colors';
const ativo = (on: boolean) =>
  on ? 'border-2 border-accent bg-soft' : 'border-border hover:border-muted hover:bg-soft';

/**
 * Desktop: novo lançamento numa janela de duas colunas que cabe inteira na tela.
 * Esquerda: valor, data, descrição e viagem. Direita: carteira e categoria.
 * Enter salva; Ctrl/⌘+Enter salva e deixa a janela aberta para o próximo; Esc fecha (no invólucro).
 */
export function JanelaNovoLancamento({
  carteiras,
  categorias,
  viagens,
  viagemAtual,
  hoje,
  carteiraInicial,
  fecharHref,
}: {
  carteiras: CarteiraOp[];
  categorias: CategoriaOp[];
  viagens: ViagemOp[];
  /** Viagem em andamento hoje: já vem marcada. */
  viagemAtual: string | null;
  hoje: string;
  carteiraInicial: string;
  fecharHref: string;
}) {
  const f = useNovoLancamento({ hoje, carteiraInicial, viagemInicial: viagemAtual });
  const ontem = addDias(hoje, -1);
  const gasto = f.kind === 'expense';

  return (
    <form
      className="flex max-h-[calc(100vh-48px)] flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void f.salvar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void f.salvar({ continuar: true });
        }
      }}
    >
      <div className="flex items-center gap-5 border-b border-soft px-7 pb-5 pt-6">
        <h2 id="titulo-novo" className="flex-1 font-display text-xl font-semibold">
          Novo lançamento
        </h2>
        <div role="tablist" aria-label="Tipo" className="flex gap-1 rounded-full border border-soft bg-bg p-1">
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={f.kind === k}
              onClick={() => f.setKind(k)}
              className={cx(
                'min-h-10 rounded-full px-5 text-sm font-semibold',
                f.kind === k ? 'bg-primary text-primary-fg' : 'text-muted hover:text-ink',
              )}
            >
              {k === 'expense' ? 'Gasto' : 'Entrada'}
            </button>
          ))}
        </div>
        <Link
          href={fecharHref}
          scroll={false}
          aria-label="Fechar"
          className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-border"
        >
          <Icon name="close" size={18} />
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)] overflow-y-auto">
        <div className="flex flex-col gap-5 border-r border-soft px-7 py-6">
          <div>
            <label htmlFor="novo-valor" className={ROTULO}>
              Valor
            </label>
            <div className="flex items-baseline gap-2 rounded-[18px] border-2 border-border bg-bg px-4 py-3 focus-within:border-accent">
              <span className="text-xl font-semibold text-muted">R$</span>
              <MoneyInput
                id="novo-valor"
                autoFocus
                value={f.cents ? centavosParaCampo(f.cents) : ''}
                onChange={(e) => {
                  const r = parseBRL(e.target.value || '0');
                  if (r.ok) f.setCents(Math.max(0, r.value));
                }}
                className="amount min-h-0 border-0 bg-transparent px-0 text-[40px] font-bold leading-tight tracking-tight shadow-none outline-none focus:ring-0 focus-visible:outline-none"
              />
            </div>
            <p className="mt-2 text-xs text-muted">Os centavos se ajustam enquanto você digita.</p>
          </div>

          <fieldset>
            <legend className={ROTULO}>Data</legend>
            <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2">
              {[
                { rotulo: 'Hoje', valor: hoje },
                { rotulo: 'Ontem', valor: ontem },
              ].map((d) => (
                <button
                  key={d.rotulo}
                  type="button"
                  aria-pressed={f.data === d.valor}
                  onClick={() => f.setData(d.valor)}
                  className={cx(
                    'min-h-10 rounded-full border px-4 text-sm font-semibold',
                    f.data === d.valor ? 'border-primary bg-primary text-primary-fg' : 'border-border',
                  )}
                >
                  {d.rotulo}
                </button>
              ))}
              <Input
                type="date"
                aria-label="Outra data"
                value={f.data}
                onChange={(e) => e.target.value && f.setData(e.target.value)}
                className="min-h-10 w-full min-w-0 rounded-full bg-bg px-3 text-sm"
              />
            </div>
          </fieldset>

          <div>
            <label htmlFor="novo-desc" className={ROTULO}>
              Descrição (opcional)
            </label>
            <Input
              id="novo-desc"
              value={f.note}
              maxLength={200}
              onChange={(e) => f.setNote(e.target.value)}
              className="bg-bg"
            />
          </div>

          {gasto && viagens.length > 0 && (
            <div>
              <label htmlFor="novo-viagem" className={ROTULO}>
                Viagem (opcional)
              </label>
              <Select
                id="novo-viagem"
                value={f.tripId ?? ''}
                onChange={(e) => f.setTripId(e.target.value || null)}
                className="bg-bg"
              >
                <option value="">Nenhuma (dia a dia)</option>
                {viagens.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 px-7 py-6">
          <fieldset>
            <legend className={ROTULO}>Carteira</legend>
            <div className="grid grid-cols-5 gap-2">
              {carteiras.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={f.walletId === w.id}
                  onClick={() => f.setWalletId(w.id)}
                  className={cx(BLOCO, 'min-h-[92px] gap-1.5', ativo(f.walletId === w.id))}
                >
                  <Icon name={ICONE_CARTEIRA[w.tipo]} size={20} />
                  <span className="w-full truncate text-sm font-semibold">{w.curto}</span>
                  {w.detalhe && <span className="w-full truncate text-xs text-muted">{w.detalhe}</span>}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={ROTULO}>Categoria</legend>
            <div className="grid grid-cols-5 gap-2">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={f.categoryId === c.id}
                  onClick={() => f.setCategoryId(f.categoryId === c.id ? null : c.id)}
                  className={cx(BLOCO, 'min-h-[76px] gap-2 p-2.5', ativo(f.categoryId === c.id))}
                >
                  <CategoryIcon nome={c.nome} cor={c.cor} className="h-9 w-9 rounded-full" />
                  <span className="w-full truncate text-[13px] font-semibold">{c.nome}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {f.erro && (
        <p role="alert" className="mx-7 mb-1 mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-expense-text">
          {f.erro}
        </p>
      )}
      <div className="flex items-center gap-3 border-t border-soft px-7 py-4">
        <p className="flex flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
          <span>
            <kbd className={KBD}>Enter</kbd> salva
          </span>
          <span>
            <kbd className={KBD}>Ctrl Enter</kbd> salva e abre outro
          </span>
          <span>
            <kbd className={KBD}>Esc</kbd> fecha
          </span>
        </p>
        <Link
          href={fecharHref}
          scroll={false}
          className="flex min-h-12 items-center rounded-full border border-border px-5 text-[15px] font-semibold"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={f.pending}
          className="min-h-12 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-fg disabled:opacity-60"
        >
          {f.pending
            ? 'Salvando…'
            : `Salvar ${gasto ? 'gasto' : 'entrada'}${f.cents > 0 ? ` de ${formatBRL(f.cents)}` : ''}`}
        </button>
      </div>
    </form>
  );
}
